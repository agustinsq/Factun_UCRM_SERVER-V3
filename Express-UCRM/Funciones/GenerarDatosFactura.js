
const axios = require("axios").default;

const EnviarFactura = require("./EnviaFacturaHacienda.js");

var data;



const GenerarDatosFactura = async (
  DatosCliente,
  WebHookUcrmData,
  NewInvoicesList,
  SendedInvoicesList
) => {
  ///El array de atributos se envía de forma desordenada, se usa filter ubicar cada atributo en una variable

  var generarFactura = DatosCliente.data.attributes.filter(
    (attribute) => attribute.key == "generarFacturaElectronica"
  );

  //Esta condición se utiliza para para forzar la no generacion de la factura.
  if (generarFactura.length === 0) {
    generarFactura = [{ value: "NO" }];
  }

  const Correo = DatosCliente.data.attributes.filter(
    (attribute) => attribute.key == "correoFacturaElectrNica"
  );

  const Cedula = DatosCliente.data.attributes.filter(
    (attribute) => attribute.key == "cDulaFacturaElectrNica"
  );

  const RazonSocial = DatosCliente.data.attributes.filter(
    (attribute) => attribute.key == "razNSocialFacturaElectrNica"
  );

  const telefono = DatosCliente.data.attributes.filter(
    (attribute) => attribute.key == "telefonoFacturaElectronica"
  );

  const Exoneracion = DatosCliente.data.attributes.filter(
    (attribute) => attribute.key == "exoneraciNFacturaElectronica"
  );

  var RazonComercial = DatosCliente.data.attributes.filter(
    (attribute) => attribute.key == "razNComercialFacturaElectrNica"
  );

  if (RazonComercial.length === 0) {
    RazonComercial = [{ value: null }];
  }

  const NumeroDocumentoExoneracion = DatosCliente.data.attributes.filter(
    (attribute) => attribute.key == "numeroDocumentoExoneracion"
  );

  const InstitucionExoneracion = DatosCliente.data.attributes.filter(
    (attribute) => attribute.key == "institucionEmitioExoneracion"
  );

  const PorcentajeExoneracion = DatosCliente.data.attributes.filter(
    (attribute) => attribute.key == "porcentajeExoneracion"
  );

  const TipoIdentificacion = DatosCliente.data.attributes.filter(
    (attribute) => attribute.key == "tipoIdentificaciN"
  );

  if (
    generarFactura[0].value === "SI" &&
    WebHookUcrmData.entity.totalTaxAmount != 0
  ) {
    //Condicional para generar factura

    //-------//Setear tipo de identificacion
    if (TipoIdentificacion[0].value === "Juridica") {
      var Tcedula = "02";
    } else {
      var Tcedula = "01";
    }

    //------//Array de productos y servicios
    var produServi = [];
    var DescuentoEspecifico = 0;
    for (var i = 0; i < WebHookUcrmData.entity.items.length; i++) {
      //console.log("DESCUENTO");
      // console.log((req.body.extraData.entity.discount / 100) *
      //  req.body.extraData.entity.items[i].price);

      ///Cuando un plan tiene un plan tiene un descuento se le llama descuneto especifico y se proceso de una forma difernete a un descuneto general que puede aplicar a todos los items en la factura.

      if (WebHookUcrmData.entity.items[i].discountPrice) {
        DescuentoEspecifico = WebHookUcrmData.entity.items[i].discountPrice;
      } else {
        DescuentoEspecifico = 0;
      }
      console.log(`Descuento Aplicado = ${DescuentoEspecifico}`);

      produServi.push({
        numero_linea: i + 1,
        codigo: "4526300000000",
        cantidad: WebHookUcrmData.entity.items[i].quantity,
        unidad_medida: "Unid",
        unidad_medida_comercial: null,
        tipo_codigo_comercial: "04",
        codigo_comercial: "IMP-02",
        detalle: `${WebHookUcrmData.entity.items[i].label}`,
        precio_unitario:
          (WebHookUcrmData.entity.items[i].price + DescuentoEspecifico) / 1.13,
        monto_descuento:
          ((WebHookUcrmData.entity.discount / 100) *
            (WebHookUcrmData.entity.items[i].price + DescuentoEspecifico)) /
          1.13,
        naturaleza_descuento: `${WebHookUcrmData.entity.discountLabel}`,
        impuesto: [
          {
            codigo: "01",
            tarifa: 13,
            codigo_tarifa: "08",
            monto_impuesto: 2957.5,
          },
        ],
        bonificacion: false,
      });
    }

    /* 
       exoneracion: {
               tipo_documento: "04",
               numero_documento: `${DatosCliente.data.attributes[5].value}`,
               nombre_institucion: `${DatosCliente.data.attributes[6].value}`,
               fecha_emision: `${ExoDate}`,
               porcentaje_exoneracion: DatosCliente.data.attributes[7].value,
               monto_exoneracion: 2957.5,
             },
       */

    /*
      console.log(produServi);
  */

    //------/// Tipo de cambio
    var TcambioVenta = 0;
    axios({
      method: "get",
      url: "https://api.hacienda.go.cr/indicadores/tc/dolar",
      headers: {},
    })
      .then(function (response) {
        // console.log(JSON.stringify(response.data));
        // console.log("Tipo de cambio obtenido");
        TcambioVenta = response.data.venta.valor;

        //------////Informacion de documento de Hacienda
        data = {
          id_externo: `${WebHookUcrmData.entity.number}`,
          tipo_documento: "01",
          codigo_actividad: "642003",
          fecha_emision: `${WebHookUcrmData.entity.createdDate}`,
          receptor: {
            razon_social: `${RazonSocial[0].value}`,
            identificacion: {
              tipo: `${Tcedula}`,
              numero: `${Cedula[0].value}`,
            },
            identificacion_extranjero: null,
            razon_comercial: `${RazonComercial[0].value}`,
            ubicacion: {
              provincia: null,
              canton: null,
              distrito: null,
              barrio: null,
              otras_senas: null,
            },
            telefono: {
              codigo_pais: "506",
              num_telefono: `${telefono[0].value}`,
            },
            fax: null,
            correo_electronico: `${Correo[0].value}`,
          },
          condicion_venta: "02",
          plazo_credito: "15",
          medio_pago: ["04"],
          detalles: produServi, ///Aqui se agregan los productos
          resumen_documento: {
            codigo_moneda: `${WebHookUcrmData.entity.currencyCode}`,
            tipo_cambio: TcambioVenta,
          },
          OtroTexto: {
            notas: "Hola Hola",
          },
        };

        /// Se envía la factura a Haciendo atravez del API de Factun
        EnviarFactura.EnviaFacturaHacienda(
          data,
          NewInvoicesList,
          SendedInvoicesList
        );
        ///////
        //console.log(data);
      })
      .catch(function (error) {
        console.log("Error al obtener el tipo de cambio");
        (cliente = data.receptor.razon_social),
          (estado = `Error al Obtener el tipo de cambio`),
          (err) => NewInvoicesList.push({ cliente, estado });
      });
  } else {
    console.log("Cliente no requiere factura electronica");
  } ///cierra el if
};


module.exports = { GenerarDatosFactura };