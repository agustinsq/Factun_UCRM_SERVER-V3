require("dotenv").config();
const express = require("express");
const axios = require("axios").default;
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const app = express();
const port = process.env.port || 3000;

var DatosCliente;

const AlertErrorMail = require("./MailAlerts/AlertErrorMail.js");
const GenerarDatos = require("./Funciones/GenerarDatosFactura.js");
const ConsultarFacturas = require("./Funciones/Consulta estado facturas/EjecutarConsultaEstadoFacturas.js")


app.use(express.json());

const schedule = require("node-schedule");

//Estas variables guardan los valores de las facturas creadas o los errores y envían un informe al correo
var ErrorsList = [];
var NewInvoicesList = []; ///Se utiliza para generar el reporte de las facturas generadas y sí ocurrío algún error. 
var SendedInvoicesList = []; // Se utiliza para guardar la lista de factura envídas para luego iniciar el proceso de comprobación con hacienda. 
var cliente;
var estado; 


///Envio de informe de correos   https://crontab.guru/
schedule.scheduleJob("*/3 * * * *", () => {
console.log("Vamos a enviar correoyyy");
console.log("NewInvoicesList");
console.log(NewInvoicesList);
    
  if (NewInvoicesList.length > 0) {
    
    AlertErrorMail.EnviarAlertErrorEmail(NewInvoicesList);
  }

  NewInvoicesList = [];
});

///Consulta estado de facturas   https://crontab.guru/bn
schedule.scheduleJob("* * * * *", () => {
  console.log("estoy en consulta estado facturas arriba");
  console.log("SendedInvoicesList");
  console.log(SendedInvoicesList);

  if (SendedInvoicesList.length > 0) {
    console.log("Se detectan facturas por confirmar se revisa maduracion en facturas pendientes");
    ConsultarFacturas.EjecutarConsultaEstadoFacturas(
      SendedInvoicesList,
      NewInvoicesList
    
    );
      console.log("estoy en consulta estado facturas abajo");
 
    console.log("NewInvoicesList")
    console.log(NewInvoicesList);
  }


});



///Escucha Webhook de UCRM 
app.post("/github", (req, res) => {
  const eventName = req.body.eventName;
  var axios = require("axios");
//Cuando se genera un evento nuevo con el webhook la respuesta es obtener los datos del cliente mediante 
  var config = {
    method: "get",
    url: `https://admin.birdlinkcr.com/crm/api/v1.0/clients/${req.body.extraData.entity.clientId}`,
    headers: {
      "Content-Type": "application/json",
      "X-Auth-App-Key": process.env.UCRM_KEY,
    },
  };
  console.log(
    `Cliente=${req.body.extraData.entity.clientFirstName} ${req.body.extraData.entity.clientLastName}`
  );
  console.log(`Empresa=${req.body.extraData.entity.clientCompanyName}`);
  console.log(`ClientID=${req.body.extraData.entity.clientId}`);

///UCRM RESPONCE
  axios(config).then((UCRMResponse) => {
    console.log("Datos Cliente de UCRM obtenidos correctamente");
    res.status(200).send();
    DatosCliente = UCRMResponse;

    ///Hacemos el llamado a la funcion que genera los datos de la facturas cuando tenemos los datos listos.
    GenerarDatos.GenerarDatosFactura(
      DatosCliente,
      req.body.extraData,
      NewInvoicesList,
      SendedInvoicesList
    );
  })
  .catch(
      (err) =>
        console.error(`Error al obtener datos de cliente: ${err}`)(
          (cliente = data.receptor.razon_social)
        ),
      (estado = `Error al obtener datos de cliente`),
      (err) => NewInvoicesList.push({ cliente, estado })
    );



  if (DatosCliente !== undefined) {
  }
});

app.use((error, req, res, next) => {
  res.status(500);
  res.send({ error: error });
  next(error);
});

app.listen(port, () => console.log(`Listening 2 at http://localhost:${port}`));
console.log(`Codigo en pruebas`);
