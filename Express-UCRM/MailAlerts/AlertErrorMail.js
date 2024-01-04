
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");



function EnviarAlertErrorEmail(datos) {


  console.log("datos para enviar vía mail");
    console.log(datos);
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.REACT_APP_EMAIL,
      pass: process.env.REACT_APP_EMAIL_PASS,
    },
  });

  let MailGenerator = new Mailgen({
    theme: "salted",
    product: {
      name: "Bird Link Facturación",
      link: "https://mailgen.js/",
    },
  });

  let response = {
    body: {
      intro: "Se ha solcitado la creación de algunas facturas electrónicas",
      table: {
        data: datos,
      },
      outro: "Favor revisar en caso de detectarse un problema",
    },
  };

  let mail = MailGenerator.generate(response);

  let mailOptions = {
    from: "Bot Bird Link",
    to: "agustinsq94@gmail.com",
    subject: `Informe de facturas electrónicas`,
    html: mail,
  };

  transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
      res.json(err);
    } else {
      res.json(info);
    }
  });
}


module.exports = { EnviarAlertErrorEmail };


