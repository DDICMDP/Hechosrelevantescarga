// ------- Formatting and builders (HTML / WhatsApp / DOCX pieces) -------
const HRFMT = (function(){
  const TitleCase = s => (s||"").toLowerCase().replace(/\b\p{L}/gu, m => m.toUpperCase());

  function titling({generales}){
    const fecha = generales?.fecha_hora || "";
    const dep   = (generales?.dependencia || "").trim();
    const car   = TitleCase(generales?.caratula || "");
    const sub   = TitleCase(generales?.subtitulo || "");

    const tipo  = generales?.tipoExp || "PU";
    const numero= (generales?.numExp || "").trim();
    const pu    = numero ? `${tipo} ${numero}` : "";

    let titleText;
    if (!pu){
      const info = `Info DDIC Mar del Plata - Adelanto ${dep}`.replace(/\s+/g,' ').trim();
      titleText = `${fecha} - ${info} - ${car || "Av. Causales de Muerte"}`;
    }else{
      titleText = `${fecha} - ${pu} - ${dep} - ${car}${sub?` - ${sub}`:""}`;
    }
    return TitleCase(titleText);
  }

  function renderPeopleTag(p){
    const name = [p.nombre, p.apellido].filter(Boolean).join(" ");
    const pretty = `${TitleCase(name)}${p.edad?` (${p.edad})`:""}${p.loc_domicilio||p.calle_domicilio?` – ${TitleCase([p.calle_domicilio,p.loc_domicilio].filter(Boolean).join(", "))}`:""}`;
    return {html:`<strong><em>${pretty}</em></strong>`, wa:`*_${pretty}_*`};
  }
  function renderObjectTag(o){
    const t = o.descripcion;
    const isSec = /secuestro/i.test(o.vinculo||"");
    return {html: isSec?`<u><em>${t}</em></u>`:`<em>${t}</em>`, wa:`_${t}_`};
  }

  function expandTags(body, snap){
    let html = body||"";
    let wa   = body||"";

    // personas
    const all = (snap.civiles||[]).concat(snap.fuerzas||[]);
    const roles = ["victima","imputado","sindicado","denunciante","testigo","pp","aprehendido","detenido","menor","nn","damnificado institucional","pf"];
    roles.forEach(r=>{
      // #r  (todos)
      if(r==="pf"){
        if((snap.fuerzas||[]).length){
          const reps = snap.fuerzas.map(renderPeopleTag).map(x=>x.html).join(", ");
          const repsWA = snap.fuerzas.map(renderPeopleTag).map(x=>x.wa).join(", ");
          html = html.replace(new RegExp(`#${r}(?!:)`,'ig'), reps);
          wa   = wa.replace(new RegExp(`#${r}(?!:)`,'ig'), repsWA);
        }
      }else{
        const arr = all.filter(p => String(p.vinculo||"").toLowerCase()===r);
        if(arr.length){
          const reps = arr.map(renderPeopleTag).map(x=>x.html).join(", ");
          const repsWA = arr.map(renderPeopleTag).map(x=>x.wa).join(", ");
          html = html.replace(new RegExp(`#${r}(?!:)`,'ig'), reps);
          wa   = wa.replace(new RegExp(`#${r}(?!:)`,'ig'), repsWA);
        }
      }
      // #r:i
      html = html.replace(new RegExp(`#${r}:(\\d+)`,'ig'), (_,i)=>{
        const src = r==="pf" ? (snap.fuerzas||[]) : all.filter(p => String(p.vinculo||"").toLowerCase()===r);
        const x = src[Number(i)];
        if(!x) return _;
        return renderPeopleTag(x).html;
      });
      wa = wa.replace(new RegExp(`#${r}:(\\d+)`,'ig'), (_,i)=>{
        const src = r==="pf" ? (snap.fuerzas||[]) : all.filter(p => String(p.vinculo||"").toLowerCase()===r);
        const x = src[Number(i)];
        if(!x) return _;
        return renderPeopleTag(x).wa;
      });
    });

    // objetos
    const cats = ["secuestro","sustraccion","hallazgo","otro"];
    cats.forEach(cat=>{
      const arr = (snap.objetos||[]).filter(o => String(o.vinculo||"").toLowerCase()===cat);
      if(arr.length){
        const reps = arr.map(renderObjectTag).map(x=>x.html).join(", ");
        const repsWA = arr.map(renderObjectTag).map(x=>x.wa).join(", ");
        html = html.replace(new RegExp(`#${cat}(?!:)`,'ig'), reps);
        wa   = wa.replace(new RegExp(`#${cat}(?!:)`,'ig'), repsWA);
      }
      html = html.replace(new RegExp(`#${cat}:(\\d+)`,'ig'), (_,i)=>{
        const x = ((snap.objetos||[]).filter(o=>String(o.vinculo||"").toLowerCase()===cat))[Number(i)];
        return x ? renderObjectTag(x).html : _;
      });
      wa = wa.replace(new RegExp(`#${cat}:(\\d+)`,'ig'), (_,i)=>{
        const x = ((snap.objetos||[]).filter(o=>String(o.vinculo||"").toLowerCase()===cat))[Number(i)];
        return x ? renderObjectTag(x).wa : _;
      });
    });

    // estilos rápidos
    html = html.replace(/\*(.+?)\*/g, "<strong>$1</strong>");
    html = html.replace(/_(.+?)_/g, "<em>$1</em>");
    html = html.replace(/!(.+?)!/g, "<u>$1</u>");

    return {html, wa};
  }

  function buildAll(snap){
    const title = titling(snap);
    const sub   = TitleCase(snap.generales?.subtitulo || "");
    const ok    = !!snap.generales?.esclarecido;
    const subHtml = `<span class="badge ${ok?'blue':'red'}"><strong>${sub}</strong></span>`;

    const {html: bodyHtml, wa: bodyWa} = expandTags(snap.cuerpo||"", snap);

    const html = `<h3><strong>${title}</strong></h3>\n<div>${subHtml}</div>\n<p>${bodyHtml}</p>`;
    const titleWA = `*${title}*`;
    const joiner = (window.WA_MERGE_SOFTBREAKS? " " : "\n");
    const waLong = `${titleWA}${joiner}${sub}${joiner}${bodyWa}`;

    // For DOCX
    const forDocx = {
      titulo: title,
      subtitulo: sub,
      color: ok ? "2563eb" : "ef4444",
      bodyHtml: bodyHtml.replace(/<p>/g,"").replace(/<\/p>/g,"\n\n")
    };

    return {html, waLong, forDocx};
  }

  function downloadCSV(list){
    const rows = [["fecha","pu","dependencia","caratula","subtitulo","texto"]];
    list.forEach(s=>{
      const pu = s.generales?.numExp ? `${s.generales?.tipoExp||"PU"} ${s.generales?.numExp}` : "";
      rows.push([s.generales?.fecha_hora||"", pu, s.generales?.dependencia||"", s.generales?.caratula||"", s.generales?.subtitulo||"", (s.cuerpo||"").replace(/\s+/g," ").trim()]);
    });
    const csv = rows.map(r=>r.map(x=>`"${String(x||"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "hechos.csv";
    a.click();
  }

  async function downloadDocx(snap, docxLib){
    const built = buildAll(snap);
    const { Document, Packer, TextRun, Paragraph, AlignmentType } = docxLib;
    if(!Document) throw new Error("docx no cargado");
    const JUST = AlignmentType.JUSTIFIED;

    function toRuns(html){
      const parts=(html||"").split(/(<\/?strong>|<\/?em>|<\/?u>)/g);
      let B=false,I=false,U=false; const runs=[];
      for(const part of parts){
        if(part==="<strong>"){B=true;continue;}
        if(part==="</strong>"){B=false;continue;}
        if(part==="<em>"){I=true;continue;}
        if(part==="</em>"){I=false;continue;}
        if(part==="<u>"){U=true;continue;}
        if(part==="</u>"){U=false;continue;}
        if(part){ runs.push(new TextRun({text:part,bold:B,italics:I,underline:U?{}:undefined})); }
      }
      return runs;
    }

    const children = [];
    children.push(new Paragraph({ children:[ new TextRun({ text: built.forDocx.titulo, bold:true }) ] }));
    children.push(new Paragraph({ children:[ new TextRun({ text: built.forDocx.subtitulo, bold:true, color: built.forDocx.color }) ] }));
    (built.forDocx.bodyHtml||"").split(/\n\n+/).forEach(p=>{
      children.push(new Paragraph({ children: toRuns(p), alignment: JUST, spacing:{after:200} }));
    });

    const doc = new Document({
      styles:{ default:{ document:{ run:{ font:"Arial", size:24 }, paragraph:{ spacing:{ after:120 } } } } },
      sections:[{ children }]
    });
    const blob = await Packer.toBlob(doc);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Hecho_${new Date().toISOString().slice(0,10)}.docx`;
    a.click();
  }

  return { TitleCase, buildAll, downloadCSV, downloadDocx };
})();