import POP3Client from "node-pop3";
import { simpleParser } from "mailparser";

import EducationVerificationLog from "./models/EducationVerificationLogSchema.js";
import BoardUniversity from "./models/BoardUniversitySchema.js";

const readEducationEmails = async () => {
  const client = new POP3Client({
    host: process.env.POP3_HOST,
    port: Number(process.env.POP3_PORT),
    tls: false,

    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS?.replace(/\s/g, ""),

    timeout: 60000,
  });

  try {
    // GET TOTAL EMAIL COUNT
    const count = await client.STAT();

    const totalEmails = parseInt(count.split(" ")[1], 10);

    // console.log("Total Emails:", totalEmails);

    if (!totalEmails || totalEmails <= 0) {
      console.log("No emails found.");

      await client.QUIT();

      return;
    }

    // READ ALL EMAILS
    for (let i = 1; i <= totalEmails; i++) {
      try {
        // console.log(`Reading education email ${i}/${totalEmails}`);

        const rawMail = await client.RETR(i);
        const mail = await simpleParser(rawMail);
        const sender = mail.from?.value?.[0]?.address?.toLowerCase()?.trim();
        const subject = mail.subject?.trim() || "";
        const message = mail.text?.trim() || "";
        const messageId = mail.messageId?.trim() || `POP3-${i}-${Date.now()}`;
        if (!sender) {
          continue;
        }

        // FIND BOARD / UNIVERSITY

        const boardUniversity = await BoardUniversity.findOne({
          boardEmail: sender,
        });

        if (!boardUniversity) {
          continue;
        }

        const match = subject.match(/#([a-fA-F0-9]{24})/);

        if (!match) {
          continue;
        }

        const verificationId = match[1];

        // FIND VERIFICATION

        const verification =
          await EducationVerificationLog.findById(verificationId);

        if (!verification) {
          continue;
        }

        // CHECK BOARD
        // Make sure this email belongs to the same board

        if (
          verification.boardId?.toString() !== boardUniversity._id.toString()
        ) {
          console.log("Board mismatch for verification:", verificationId);

          continue;
        }

        // DUPLICATE EMAIL CHECK

        const alreadyReply = verification.verificationReplies?.some(
          (reply) => reply.messageId === messageId,
        );

        if (alreadyReply) {
          continue;
        }

        // SAVE EMAIL REPLY

        verification.verificationReplies.push({
          messageId,
          from: sender,
          subject,
          message,
          date: new Date(),
          sendByVerification: false,
        });

        // DETERMINE RESULT FROM EMAIL

        const replyText = `${subject}\n${message}`.toLowerCase();

        let result = "Not Verified";

        // VERIFIED / OK
        if (
          replyText.includes("verified") ||
          replyText.includes("verification successful") ||
          replyText.includes("verification is successful") ||
          replyText.includes("ok") ||
          replyText.includes("valid")
        ) {
          result = "Ok";
        }

        // NOT FOUND
        if (
          replyText.includes("no found") ||
          replyText.includes("not found") ||
          replyText.includes("record not found") ||
          replyText.includes("invalid")
        ) {
          result = "No Found";
        }

        // UPDATE VERIFICATION

        verification.result = result;

        if (result === "Ok") {
          verification.status = "Verified";
          verification.verifiedDate = new Date();
          verification.verifiedBy = "Board Email";
        } else if (result === "No Found") {
          verification.status = "Not Found";
          verification.verifiedDate = new Date();
          verification.verifiedBy = "Board Email";
        } else {
          verification.status = "Responded";
        }

        verification.remarks =
          `Education verification reply received from ${sender}. ` +
          `Subject: ${subject}. ` +
          `Message ID: ${messageId}. ` +
          `Result: ${result}.`;

        await verification.save();

        console.log(
          "Education verification reply saved successfully:",
          verificationId,
        );
      } catch (err) {
        // console.error(
        //   "Education mail processing error:",
        //   err.message,
        // );
      }
    }

    await client.QUIT();

    console.log("Education verification email checking completed.");
  } catch (error) {
    console.error("Education email reader error:", error.message);

    try {
      await client.QUIT();
    } catch (e) {
      console.error("POP3 QUIT error:", e.message);
    }
  }
};

export default readEducationEmails;
