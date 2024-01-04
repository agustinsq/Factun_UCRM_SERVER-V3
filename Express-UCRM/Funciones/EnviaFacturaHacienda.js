const axios = require("axios").default;

var claveFactura;

const ConsultarHacienda = require("./ConsultaEstadoFacturaHacienda.js");

const EnviaFacturaHacienda = async (
  data,
  NewInvoicesList,
  SendedInvoicesList
) => {
  ///Envia Factura a Hacienda
  var config = {
    method: "post",
    url: "https://api.factun.com/api/V2/Documento/Enviar",
    headers: {
      FactunToken: process.env.FACTUM_TOKEN,
      "Content-Type": "application/json",
      Authorization: process.env.AUTORIZATION,
    },

    data: data,
  };

  try {
    resp = await axios(config);
    console.log("Documento enviado a Factum");
    claveFactura = resp.data.data.clave;
    
  } catch (err) {
    console.error(`Error al enviar Factura a Factun: ${err}`),
      (cliente = data.receptor.razon_social),
      (estado = `Error al Enviar Factura a Hacienda.`),
      (err) => NewInvoicesList.push({ cliente, estado });
  }

  //Aquí se debe hacer una funcion que guarde los números de las facturas para consutlar los estados posteriormente.
const timeStamp = Date.now();

  SendedInvoicesList.push([claveFactura,timeStamp,data])

};

module.exports = { EnviaFacturaHacienda };

///UCRM RESPONCE
