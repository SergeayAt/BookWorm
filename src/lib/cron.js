import cron from "node-cron";
import https from "https";

const job = cron.schedule("14 * * * *", function () {
    https
    .get(process.env.API_URL, (res) => {
        if (res.statusCode === 200) {
            console.log("Cron job executed successfully");
        } else {
            console.log("Cron job failed", res.statusCode);
        }
    })
    .on("error", (err) => {
        console.log("Cron job error sending request", err);
    });
});

export default job;
