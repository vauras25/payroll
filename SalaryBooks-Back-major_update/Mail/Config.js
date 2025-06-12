const nodemailer = require("nodemailer");

async function sendMail(maildata) {

}
module.exports = {
  sendEmail: async function (smtp, maildata) {
    // var smtp_data=maildata.smtp_data;
    var smtp_data = smtp;
    // console.log(smtp, "aman11", maildata);

    let transporter = nodemailer.createTransport({
      host: smtp_data.host_address,
      port: smtp_data.port,
      secure: false,
      auth: {
        user: smtp_data.username,
        pass: smtp_data.password,
      },
    });

  

    let info = await transporter.sendMail({
      from: '"Sandeep Singh" <' + smtp_data.from_email_address + '>',
      // from: smtp_data.from_email_address, 
      to: maildata.to_mail,
      subject: maildata.subject,
      // text: maildata.msg_body, 
      text: maildata.body.replace(/<\/?[^>]+(>|$)/g, ""),
      html: maildata.body,
      attachments: maildata.attachments || ''
      //  attachments: [
      // {
      //   filename: 'salary slip',          // Name it will show as in the email
      //   path: 'D:/payslip-VBL-3193-4-2023.pdf',     // Absolute or relative path to the file
      //   contentType: 'application/pdf'
      // }
    // ]
    })
    return {
      status: "success", message: "Email sent successfully",
      super: "1",
    };

  }

};