const axios = require("axios").default;



const ConsultaEstadoFacturaHacienda = async (
  claveFactura,
  data,
  NewInvoicesList
) => {
  //Consulta estado Factura Hacienda

 console.log("NewInvoicesList estoy en ConsultaEstadoFacturaHacienda arriba");
 console.log(NewInvoicesList);


  var config = {
    method: "put",
    url: `https://api.factun.com/api/V2/Documento/Consultar/${claveFactura}`,
    headers: {
      FactunToken: process.env.FACTUM_TOKEN,
      "Content-Type": "application/json",
      Authorization: process.env.AUTORIZATION,
    },
  };


  axios(config)
    .then((factunResponse) => {
      console.log("Respuesta positiva de hacienda");
  
        //claveFactura = factunResponse.data.data.clave;

      
      console.log("NewInvoicesList estoy en ConsultaEstadoFacturaHacienda abajo");
      console.log(NewInvoicesList);
    })
    .catch(
      (err) => console.error(`Error al obtener status de Hacienda: ${err}`),

      (cliente = data.receptor.razon_social),
      (estado = `Error al consultar estado de factura en Hacienda`),
     (err) => NewInvoicesList.push({ cliente, estado })
  );

  (cliente = data.receptor.razon_social),
    (estado = `Factura creada correctamente`),
    NewInvoicesList.push({ cliente, estado });  

};


module.exports = { ConsultaEstadoFacturaHacienda };