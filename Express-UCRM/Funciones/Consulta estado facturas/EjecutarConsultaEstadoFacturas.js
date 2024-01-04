



const EjecutarConsultaEstadoFacturas = async (SendedInvoicesList, NewInvoicesList) => {
  const ConsultarHacienda = require("../ConsultaEstadoFacturaHacienda.js");

    
    
       if ((Date.now() - SendedInvoicesList[0][1]) / 1000 > 5) {
         console.log("Exito en prueba de tiempo");
         ConsultarHacienda.ConsultaEstadoFacturaHacienda(
           SendedInvoicesList[0][0],
           SendedInvoicesList[0][2],
           NewInvoicesList
         );
         SendedInvoicesList.shift();
       }
    
    
/*
  //Consulta si las facturas tienen un tiempo de maduración de almenos 2 minutos
    for (var i = 0; i < SendedInvoicesList.length; i++) {
        
      if ((Date.now() - SendedInvoicesList[i][1])/1000 > 120) {
        console.log("Exito en prueba de tiempo")
      ConsultarHacienda.ConsultaEstadoFacturaHacienda(
        SendedInvoicesList[i][0],
        SendedInvoicesList[i][2],
        NewInvoicesList
      );
          SendedInvoicesList.shift();
    }
    }
    */
}

module.exports = { EjecutarConsultaEstadoFacturas };
