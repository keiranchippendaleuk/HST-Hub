const router = require("express").Router();
require("dotenv").config();
const userSchema = require("../schemas/Users");
const jobSchema = require("../schemas/Jobs");
const { Webhook, MessageBuilder } = require("discord-webhook-node");

// Recieve Job, Lookup User, if user exists, add job to DB, calculate points and add points to user, send webhook, status code 200

router.get("/jobs/delivered", async (req, res, next) => {
  res.send("OK");
});

router.post("/jobs/delivered", async (req, res, next) => {
  try {
    const jobs = (await jobSchema.find()) || [];
    const duplicateJob = jobs.find((f) => f.id == req.body.jobID) || false;

    if (duplicateJob) return res.sendStatus(403);

    if (req.body.type == "job.started") {
      // Job Started
      return;
    }

    const jobSubmit = req.body.data.events.find((f) => f.type == "delivered");

    if (jobSubmit) {
      const job = req.body.data;

      const driver =
        (await userSchema.findOne({
          steamID: job.driver.steamID,
        })) || false;

      if (driver) {
        let distance = Math.round(job.distanceDriven);
        let points = Math.round(distance * 1);

        let submittedDate = new Date(job.realtime.end).toLocaleDateString(
          "en-US",
          { timeZone: "America/Toronto" }
        );

        await userSchema.findOneAndUpdate(
          { steamID: job.driver.steamID },
          {
            points: driver.points + points,
            distance: driver.distance + job.distanceDriven,
            jobs:
              (driver.jobs ||
                jobs.filter((f) => f?.driver?.userID == driver.userID)
                  ?.length ||
                0) + 1,
          }
        );

        await new jobSchema({
          id: job.jobID,
          object: "job",
          driver: {
            id: job.driver.userID,
            steam_id: job.driver.steamID,
            username: driver.username,
            userID: driver.userID,
          },
          planned_distance: job.plannedDistance,
          submittedDate: submittedDate,
          driven_distance: job.distanceDriven,
          source_city: job.source.city,
          source_company: job.source.company,
          destination_city: job.destination.city,
          destination_company: job.destination.company,
          cargo: job.cargo,
          game: job.game,
          fuel_used: job.fuel.burned,
          truck: job.truck,
          events: job.events,
          points: points,
        }).save();

        // checkDriverRank(driver.userID)

        try {
          const hook = new Webhook(
            process.env.webhookURL
          );

          const DeliveryEmbed = new MessageBuilder()
            .setAuthor(`${driver.username}`, `${driver.avatar}`)
            .setTitle(`Job Submitted - #${job.jobID}`)
            .setURL(`https://hub.highspeedtrucking.ca/jobs/${job.jobID}`)
            .addField("From", `${job.source.city.name}`, true)
            .addField("To", `${job.destination.city.name}`, true)
            .addField(
              "Details",
              `Distance: ${distance} km\nPoints: ${points}\nSource Company: ${job.source.company.name}\nDestination Company: ${job.destination.company.name}`
            )
            .setColor('#2f3136')

          hook.setUsername(`HST Job Logger`);
          hook.setAvatar("https://i.imgur.com/820FceD.png");
          hook.send(DeliveryEmbed);
        } catch (err) {
          console.log(err);
          return res.sendStatus(500);
        }

        res.sendStatus(200);
      } else {
        res.status(404).json({
          error: true,
          message: `Driver not found.`,
        });
      }
    }
  } catch (err) {}
});

async function checkDriverRank(userID) {
  const driver = (await userSchema.findOne({ userID: userID })) || false;

  if (driver) {
    const driverpoints = driver.points || 0;
    const ranks = [];

    const rankupEmbed = new MessageBuilder();

    if (driver.discord) {
      await fetch(
        `https://discord.com/api/guilds/${config.guildID}/members/${driver.discord.id}`,
        {
          headers: {
            Authorization: `Bot ${process.env.botToken}`,
            "Content-Type": "application/json",
          },
        }
      )
        .then((body) => {
          return body.json();
        })
        .then(async (json) => {
          const { roles } = json;

          const rank = ranks.find(
            (f) => driverpoints > f.min && driverpoints <= f.max
          );
          const otherRank = ranks.filter((f) => f.role != rank.role);

          if (rank && !roles.includes(rank.role)) {
            rankupEmbed.setColor("BLURPLE");
            rankupEmbed.setDescription(
              `Congratulations ${driver.username}! You have been promoted to ${rank.name}!`
            );

            await userSchema.findOneAndUpdate(
              { userID: userID },
              {
                rank: rank.rank,
              }
            );

            roleadd(driver.discord.id, rank.role);

            otherRank.forEach((r) => {
              roleremove(driver.discord.id, r.role);
            });
          }

          await fetch(
            `https://discord.com/api/channels/${process.env.rankUpChannel}/messages`,
            {
              method: "POST",
              body: JSON.stringify({
                embeds: [rankupEmbed],
              }),
              headers: {
                Authorization: `Bot ${process.env.botToken}`,
                "Content-Type": "application/json",
              },
            }
          ).catch((err) => {});
        })
        .catch((err) => {});
    }
  }
}

function roleadd(user, id) {
  fetch(
    `https://discord.com/api/guilds/${process.env.guildID}/members/${user}/roles/${id}`,
    {
      method: "PUT",
      headers: {
        authorization: `Bot ${process.env.botToken}`,
        "Content-Type": "application/json",
      },
    }
  ).catch((err) => {
    console.log(err);
  });
}

function roleremove(user, id) {
  fetch(
    `https://discord.com/api/guilds/${process.env.guildID}/members/${user}/roles/${id}`,
    {
      method: "DELETE",
      headers: {
        authorization: `Bot ${process.env.botToken}`,
        "Content-Type": "application/json",
      },
    }
  ).catch((err) => {
    console.log(err);
  });
}

module.exports = router;
