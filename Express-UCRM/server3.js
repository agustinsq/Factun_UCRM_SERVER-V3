require("dotenv").config();
const express = require("express");
const axios = require("axios").default;
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const app = express();
const port = process.env.port || 3000;
var claveFactura = 0;
var DatosCliente;
const AlertErrorMail = require("./MailAlerts/AlertErrorMail.js");
app.use(express.json());

const schedule = require("node-schedule");

//Estas variables guardan los valores de las facturas creadas o los errores y envían un informe al correo
var ErrorsList = [];
var NewInvoicesList = [];
var cliente;
var estado;

console.log("NewInvoicesList");
console.log(NewInvoicesList);

schedule.scheduleJob("* * * * *", () => {
  if (NewInvoicesList.length > 0) {
    console.log("Vamos a enviar correo");
    AlertErrorMail.EnviarAlertErrorEmail(NewInvoicesList);
  }

  NewInvoicesList = [];
});

app.post("/github", (req, res) => {
  const eventName = req.body.eventName;
  var axios = require("axios");

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

  ///UCRM RESPONCE
  axios(config)
    .then((UCRMResponse) => {
      console.log("Datos Cliente de UCRM obtenidos correctamente");
      res.status(200).send();
      DatosCliente = UCRMResponse;
      // console.log(DatosCliente.data.attributes[2].value);

      //console.log(DatosCliente.data);

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
        req.body.extraData.entity.totalTaxAmount != 0
      ) {
        //Condicional para generar factura

        //Setear tipo de identificacion
        if (TipoIdentificacion[0].value === "Juridica") {
          var Tcedula = "02";
        } else {
          var Tcedula = "01";
        }

        //Array de productos y servicios
        var produServi = [];
        var DescuentoEspecifico = 0;
        for (var i = 0; i < req.body.extraData.entity.items.length; i++) {
          //console.log("DESCUENTO");
          // console.log((req.body.extraData.entity.discount / 100) *
          //  req.body.extraData.entity.items[i].price);

          ///Cuando un plan tiene un plan tiene un descuento se le llama descuneto especifico y se proceso de una forma difernete a un descuneto general que puede aplicar a todos los items en la factura.

          if (req.body.extraData.entity.items[i].discountPrice) {
            DescuentoEspecifico =
              req.body.extraData.entity.items[i].discountPrice;
          } else {
            DescuentoEspecifico = 0;
          }
          console.log(`Descuento Aplicado = ${DescuentoEspecifico}`);

          produServi.push({
            numero_linea: i + 1,
            codigo: "4526300000000",
            cantidad: req.body.extraData.entity.items[i].quantity,
            unidad_medida: "Unid",
            unidad_medida_comercial: null,
            tipo_codigo_comercial: "04",
            codigo_comercial: "IMP-02",
            detalle: `${req.body.extraData.entity.items[i].label}`,
            precio_unitario:
              (req.body.extraData.entity.items[i].price + DescuentoEspecifico) /
              1.13,
            monto_descuento:
              ((req.body.extraData.entity.discount / 100) *
                (req.body.extraData.entity.items[i].price +
                  DescuentoEspecifico)) /
              1.13,
            naturaleza_descuento: `${req.body.extraData.entity.discountLabel}`,
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

        /// Tipo de cambio

        var TcambioVenta = 0;
        axios({
          method: "get",
          url: "https://tipodecambio.paginasweb.cr/api",
          headers: {},
        })
          .then(function (response) {
            // console.log(JSON.stringify(response.data));
            // console.log("Tipo de cambio obtenido");
            TcambioVenta = response.data.venta;

            //Informacion de documento de Hacienda
            var data = {
              id_externo: `${req.body.extraData.entity.number}`,
              tipo_documento: "01",
              codigo_actividad: "642003",
              fecha_emision: `${req.body.extraData.entity.createdDate}`,
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
                codigo_moneda: `${req.body.extraData.entity.currencyCode}`,
                tipo_cambio: TcambioVenta,
              },
              OtroTexto: {
                notas: "Hola Hola",
              },
            };

            //console.log(data);

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
            axios(config)
              .then((factunResponse) => {
                console.log("Documento enviado a Factum");
                /* console.log(factunResponse.data);*/
                res.status(200).send();
                claveFactura = factunResponse.data.data.clave;

                //Consulta estado Factura Hacienda
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
                    cliente = data.receptor.razon_social;
                    estado = "Respuesta positiva de hacienda";

                    NewInvoicesList.push({ cliente, estado });

                    res.status(200).send();
                    claveFactura = factunResponse.data.data.clave;
                  })
                  .catch(
                    (err) =>
                      console.error(
                        `Error al obtener status de Hacienda: ${err}`
                      ),

                    (cliente = data.receptor.razon_social),
                    (estado = `Error al obtener status de Hacienda`),
                    NewInvoicesList.push({ cliente, estado })
                  );
              })
              .catch(
                (err) =>
                  console.error(`Error al enviar Factura a Factun: ${err}`),
                (cliente = data.receptor.razon_social),
                (estado = `Error al enviar Factura a Factun`),
                NewInvoicesList.push({ cliente, estado })
              );
          })
          .catch(function (error) {
            console.log(error);
          });
      } else {
        console.log("Cliente no requiere factura electronica");
      } ///cierra el if
    })
    .catch(
      (err) =>
        console.error(`Error al obtener datos de cliente: ${err}`)(
          (cliente = data.receptor.razon_social)
        ),
      (estado = `Error al obtener datos de cliente`),
      NewInvoicesList.push({ cliente, estado })
    );

  console.log(req.body.extraData.entity.clientId);
  if (DatosCliente !== undefined) {
  }
});

app.use((error, req, res, next) => {
  res.status(500);
  res.send({ error: error });
  next(error);
});

app.listen(port, () => console.log(`Listening at http://localhost:${port}`));
console.log(`Codigo en producción`);