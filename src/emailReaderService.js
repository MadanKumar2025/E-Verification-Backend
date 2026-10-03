// import POP3Client from "node-pop3";
// import { simpleParser } from "mailparser";

// import EmploymentVerificationLog from "./models/EmploymentVerificationLogSchema.js";
// import MasterEmployer from "./models/MasterEmployerSchema.js";
// import { getIO } from "./socket.js";

// const readEmails = async () => {
//   const client = new POP3Client({
//     // host: "mail.gaayegaindia.in",
//     // port: 110,
//     // secure: false,
//     // user: "verification@gaayegaindia.in",
//     // password: "sjvyunbxatflipr3zowd",
//     host: process.env.POP3_HOST,
//     port: Number(process.env.POP3_PORT),
//     tls: false,
//     user: process.env.EMAIL_USER,
//     password: process.env.EMAIL_PASS.replace(/\s/g, ""),

//     timeout: 60000,
//   });
//   try {
//     // console.log("Connecting POP3 Server...");

//     // Get mail count
//     const count = await client.STAT();

//     // console.log("STAT:", count);
//     // console.log("Type:", typeof count);
//     // console.log("count.count =", count.count);

//     const totalEmails = parseInt(count.split(" ")[0], 10);
//     // console.log("Total Emails:", totalEmails);

//     for (let i = 1; i <= totalEmails; i++) {
//       try {
//         // console.log("Reading email:", i);
//         const rawMail = await client.RETR(i);

//         const mail = await simpleParser(rawMail);

//         const sender = mail.from?.value?.[0]?.address?.toLowerCase();

//         const subject = mail.subject || "";

//         const message = mail.text || "";

//         const messageId = mail.messageId;

//         // console.log("Sender:", sender);
//         // console.log("Subject:", subject);
//         // console.log("Message:", message);
//         // console.log("Message ID:", messageId);

//         // console.log("--------------------------------");
//         // console.log("Employer Reply Received");
//         // console.log("From:", sender);
//         // console.log("Subject:", subject);

//         const employer = await MasterEmployer.findOne({
//           email: sender,
//         });

//         if (!employer) {
//           // console.log("Employer not found:", sender);

//           continue;
//         }

//         const match = subject.match(/#([a-f0-9]{24})/);

//         // console.log("match", match);

//         if (!match) {
//           console.log("Verification ID not found");
//           continue;
//         }

//         const verification = await EmploymentVerificationLog.findById(match[1]);

//         if (!verification) {
//           // console.log("Verification record not found");
//           continue;
//         }

//         const alreadyReply = verification.employerReplies?.some(
//           (x) => x.messageId === messageId,
//         );

//         if (alreadyReply) {
//           // console.log("Already saved");
//           continue;
//         }

//         verification.employerReplies.push({
//           messageId,
//           from: sender,
//           subject,
//           message,
//           date: new Date(),
//         });

//         verification.status = "Responded";

//         verification.updatedDate = new Date();

//         await verification.save();

//         // console.log("Reply saved successfully");
//       } catch (err) {
//         console.log("Mail processing error:", err.message);
//       }
//     }

//     await client.QUIT();

//     // console.log("Email reading completed");
//   } catch (error) {
//     console.log("Email reader error:", error.message);

//     try {
//       await client.QUIT();
//     } catch (e) {}
//   }
// };

// export default readEmails;


import POP3Client from "node-pop3";
import { simpleParser } from "mailparser";

import EmploymentVerificationLog from "./models/EmploymentVerificationLogSchema.js";
import MasterEmployer from "./models/MasterEmployerSchema.js";

let isReadingEmails = false;

const readEmails = async () => {
  // Prevent multiple POP3 connections at the same time
  if (isReadingEmails) {
    console.log("Email reader is already running. Skipping...");
    return;
  }

  isReadingEmails = true;

  let client = null;

  try {
    // Validate environment variables
    if (!process.env.POP3_HOST) {
      throw new Error("POP3_HOST is not configured");
    }

    if (!process.env.POP3_PORT) {
      throw new Error("POP3_PORT is not configured");
    }

    if (!process.env.EMAIL_USER) {
      throw new Error("EMAIL_USER is not configured");
    }

    if (!process.env.EMAIL_PASS) {
      throw new Error("EMAIL_PASS is not configured");
    }

    const port = Number(process.env.POP3_PORT);

    if (Number.isNaN(port)) {
      throw new Error(
        `Invalid POP3_PORT: ${process.env.POP3_PORT}`
      );
    }

    const password = process.env.EMAIL_PASS.replace(/\s/g, "");

    console.log(
      `Connecting to POP3 server ${process.env.POP3_HOST}:${port}...`
    );

    client = new POP3Client({
      host: process.env.POP3_HOST,
      port,
      tls: false,
      user: process.env.EMAIL_USER,
      password,
      timeout: 60000,
    });

    // --------------------------------------------------
    // Get mailbox status
    // --------------------------------------------------

    const count = await client.STAT();

    console.log("POP3 STAT:", count);

    const totalEmails = parseInt(
      count.split(" ")[0],
      10
    );

    if (Number.isNaN(totalEmails)) {
      throw new Error(
        `Invalid POP3 STAT response: ${count}`
      );
    }

    console.log(`Total emails: ${totalEmails}`);

    if (totalEmails === 0) {
      console.log("No emails found.");
      return;
    }

    // --------------------------------------------------
    // Read emails
    // --------------------------------------------------

    for (let i = 1; i <= totalEmails; i++) {
      try {
        // console.log(`Reading email ${i}/${totalEmails}...`);

        const rawMail = await client.RETR(i);

        if (!rawMail) {
          console.log(`Email ${i} returned empty data.`);
          continue;
        }

        const mail = await simpleParser(rawMail);

        // --------------------------------------------------
        // Extract email information
        // --------------------------------------------------

        const sender =
          mail.from?.value?.[0]?.address?.toLowerCase();

        const subject = mail.subject || "";

        const message = mail.text || "";

        const messageId = mail.messageId;

        // console.log("Sender:", sender);
        // console.log("Subject:", subject);

        if (!sender) {
          console.log(
            `Email ${i}: sender not found. Skipping.`
          );
          continue;
        }

        if (!messageId) {
          console.log(
            `Email ${i}: message ID not found. Skipping.`
          );
          continue;
        }

        // --------------------------------------------------
        // Find employer
        // --------------------------------------------------

        const employer = await MasterEmployer.findOne({
          email: sender,
        });

        if (!employer) {
          // console.log(
          //   `Employer not found for sender: ${sender}`
          // );

          continue;
        }

        // --------------------------------------------------
        // Extract Verification ID from subject
        //
        // Example:
        // Re: Employment Verification #65f123...
        // --------------------------------------------------

        const match = subject.match(
          /#([a-f0-9]{24})/i
        );

        if (!match) {
          console.log(
            `Verification ID not found in subject: ${subject}`
          );

          continue;
        }

        const verificationId = match[1];

        // --------------------------------------------------
        // Find verification record
        // --------------------------------------------------

        const verification =
          await EmploymentVerificationLog.findById(
            verificationId
          );

        if (!verification) {
          // console.log(
          //   `Verification record not found: ${verificationId}`
          // );

          continue;
        }

        // --------------------------------------------------
        // Prevent duplicate reply
        // --------------------------------------------------

        const alreadyReply =
          verification.employerReplies?.some(
            (x) => x.messageId === messageId
          );

        if (alreadyReply) {
          console.log(
            `Already processed email: ${messageId}`
          );

          continue;
        }

        // --------------------------------------------------
        // Save employer reply
        // --------------------------------------------------

        verification.employerReplies.push({
          messageId,
          from: sender,
          subject,
          message,
          date: new Date(),
        });

        verification.status = "Responded";

        verification.updatedDate = new Date();

        await verification.save();

        console.log(
          `Employer reply saved successfully: ${messageId}`
        );
      } catch (err) {
        // Error for individual email
        console.error(
          `Mail ${i} processing error:`,
          err?.message || err
        );

        // Continue with next email
        continue;
      }
    }

    console.log("Email reading completed successfully.");
  } catch (error) {
    console.error(
      "Email reader error:",
      error?.message || error
    );

    console.error(
      "POP3 Host:",
      process.env.POP3_HOST
    );

    console.error(
      "POP3 Port:",
      process.env.POP3_PORT
    );
  } finally {
    // --------------------------------------------------
    // Always close POP3 connection
    // --------------------------------------------------

    if (client) {
      try {
        await client.QUIT();

        console.log("POP3 connection closed.");
      } catch (quitError) {
        console.log(
          "POP3 QUIT error:",
          quitError?.message || quitError
        );
      }
    }

    isReadingEmails = false;
  }
};

export default readEmails;
