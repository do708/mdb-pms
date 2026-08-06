import {
    internalNotificationRecipients,
    projectMailbox,
    sendResendEmail,
} from "@/lib/email/resendClient";



interface AfspraakMailData {

    to:string;

    contactpersoon?:string;

    klant:string;

    werkzaamheden:string;

    locatie:string;

    datum:string;

    aanvang:string;

}



export async function sendAfspraakMail(
    data:AfspraakMailData
){


    // Absolute URL naar het logo (moet publiek bereikbaar zijn voor e-mail).
    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL
        || "https://pms.mdb-networks.nl";

    const logoUrl =
        `${appUrl.replace(/\/$/, "")}/images/MDB-Logo.png`;



    const aanhef =
        data.contactpersoon && data.contactpersoon.trim()
        ?
        `Goedendag ${data.contactpersoon.trim()},`
        :
        "Goedendag,";


    // Knoppen openen bij de klant een nieuwe mail naar projects@ met een
    // ingevuld onderwerp en begintekst, zodat ze alleen nog hoeven te reageren.
    const onderwerpKern =
        `Afspraak ${data.klant} - ${data.werkzaamheden} (${data.datum})`;

    const akkoordLink =
        `mailto:projects@mdb-networks.nl`
        + `?subject=${encodeURIComponent(`AKKOORD - ${onderwerpKern}`)}`
        + `&body=${encodeURIComponent(
            `Goedendag,\n\nWij gaan akkoord met de voorgestelde afspraak:\n`
            + `Datum: ${data.datum}\nAanvang: ${data.aanvang}\nLocatie: ${data.locatie}\n\n`
            + `Met vriendelijke groet,\n`
        )}`;

    const nietAkkoordLink =
        `mailto:projects@mdb-networks.nl`
        + `?subject=${encodeURIComponent(`NIET AKKOORD - ${onderwerpKern}`)}`
        + `&body=${encodeURIComponent(
            `Goedendag,\n\nDe voorgestelde datum of tijd komt ons helaas niet uit.\n`
            + `Ons voorstel voor een alternatief:\n\n\n`
            + `Met vriendelijke groet,\n`
        )}`;



    const tekst =
`${aanhef}

In opdracht van ${data.klant} willen wij graag de onderstaande werkzaamheden verzorgen op de aangegeven locatie.

Locatie: ${data.locatie}
Datum: ${data.datum}
Aanvang: ${data.aanvang}

Werkzaamheden: ${data.werkzaamheden}

Graag vernemen wij of deze datum en het voorgestelde tijdsblok voor u passend zijn.

Na ontvangst van uw bevestiging plannen wij de installatie definitief in.

U kunt reageren door te antwoorden op deze e-mail met "Akkoord" of "Niet akkoord".

Mocht de voorgestelde datum of het tijdstip niet uitkomen, dan kijken wij uiteraard graag samen naar een passend alternatief.

Wij zien uw reactie met belangstelling tegemoet.

Met vriendelijke groet, kind regards,
Project Administratie
MDB Networks
`;


    const html =
`<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6">

  <p>${aanhef}</p>

  <p>In opdracht van <strong>${data.klant}</strong> willen wij graag de onderstaande
     werkzaamheden verzorgen op de aangegeven locatie.</p>

  <p>
    <strong>Locatie:</strong> ${data.locatie}<br>
    <strong>Datum:</strong> ${data.datum}<br>
    <strong>Aanvang:</strong> ${data.aanvang}
  </p>

  <p>
    <strong>Werkzaamheden:</strong> ${data.werkzaamheden}
  </p>

  <p>Graag vernemen wij of deze datum en het voorgestelde tijdsblok voor u passend zijn.</p>

  <p><strong>Na ontvangst van uw bevestiging plannen wij de installatie definitief in.</strong></p>

  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0">
    <tr>
      <td style="padding-right:10px">
        <a href="${akkoordLink}"
           style="display:inline-block;background:#16a34a;color:#ffffff;
                  text-decoration:none;padding:12px 22px;border-radius:8px;
                  font-weight:bold">
          ✓ Akkoord
        </a>
      </td>
      <td>
        <a href="${nietAkkoordLink}"
           style="display:inline-block;background:#dc2626;color:#ffffff;
                  text-decoration:none;padding:12px 22px;border-radius:8px;
                  font-weight:bold">
          ✗ Niet akkoord
        </a>
      </td>
    </tr>
  </table>

  <p>Mocht de voorgestelde datum of het tijdstip niet uitkomen, dan kijken wij uiteraard
     graag samen naar een passend alternatief.</p>

  <p>Wij zien uw reactie met belangstelling tegemoet.</p>

  <p style="margin-top:24px;line-height:1.9">
     Met vriendelijke groet, kind regards,<br><br>
     <strong>Project Administratie</strong><br>
     MDB Networks
  </p>

  <p style="margin-top:24px">
    <img src="${logoUrl}" alt="MDB Networks" width="300"
         style="display:block;max-width:300px;height:auto">
  </p>

</div>`;



    await sendResendEmail({

        from:
            "MDB Networks <noreply@mdb-networks.nl>",

        to:[
            data.to
        ],

        bcc: internalNotificationRecipients(),

        replyTo:
            projectMailbox(),

        subject:
            `Afspraakbevestiging — werkzaamheden ${data.klant}`,

        text:
            tekst,

        html:
            html

    });

}
