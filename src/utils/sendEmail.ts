import nodemailer from "nodemailer";
import smtpTransport from 'nodemailer-smtp-transport';


export async function sendEmail(to: string, html: string) {


  let transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    host:'smtp.gmail.com',
    auth: {
      user: 'myemail@email.com', // generated ethereal user
      pass: 'minhasenhasecreta', // generated ethereal password
    },
  }));

  var mailOptions = {
    from: 'myemail@email.com',
    to,
    subject: 'Sending Email using Node.js[nodemailer]',
    html,
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  });  

}
