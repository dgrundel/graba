import { nanoid } from 'nanoid';
import nodemailer from 'nodemailer';

export class Mailer {
    async send(image: Buffer) {
        let testAccount = await nodemailer.createTestAccount();
        let transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });

        const cid = nanoid();

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"Fred Foo 👻" <foo@example.com>', // sender address
            to: "bar@example.com, baz@example.com", // list of receivers
            subject: "Hello ✔", // Subject line
            text: "Motion Alert", // plain text body
            html: `<h1>Motion Alert</h1><img src="cid:${cid}"/>`, // html body
            attachments: [
                {
                    cid,
                    filename: 'still.jpg',
                    contentType: 'image/jpeg',
                    content: image,
                }
            ]
        });

        console.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
}