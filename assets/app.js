(function(){
  const $ID = id => document.getElementById(id);
  const val = id => ($ID(id)?.value ?? "");
  const setv= (id,v)=>{ if($ID(id)) $ID(id).value=v; };
  const chk = id => !!$ID(id)?.checked;
  const $$  = sel => Array.from(document.querySelectorAll(sel));
  const showErr = m => { const b=$ID("errorBox"); if(b){ b.textContent="Error: "+m; b.hidden=false; } };

  // Fecha formateada dd-mm-aaaa
  function fmtFecha(){ const d=val("g_fecha_dia"); if(!d) return ""; const [y,m,day]=d.split("-"); return `${day}-${m}-${y}`; }

  // Catalog storage
  const CASEKEY="hr_cases_v1"; const CATKEY="hr_catalogs_v1";
  const DEFAULT_CATALOGS={
    "General Pueyrredon":{ localidades:["Mar del Plata","Batán","Sierra de los Padres","Chapadmalal","Estación Camet","El Boquerón"], dependencias:["Comisaría 1ra MdP","Comisaría 2da MdP","Comisaría 3ra MdP","Comisaría 4ta MdP","Comisaría 5ta MdP","Comisaría 6ta MdP","Subcomisaría Camet","Subcomisaría Acantilados","DDI Mar del Plata","Comisaría de la Mujer MdP","UPPL MdP","CPO MdP"]},
    "Balcarce":{ localidades:["Balcarce","San Agustín","Los Pinos"], dependencias:["Comisaría Balcarce","Comisaría de la Mujer Balcarce","DDI Balcarce","Destacamento San Agustín"]},
    "Mar Chiquita":{ localidades:["Coronel Vidal","Santa Clara del Mar","Vivoratá","Mar de Cobo","La Caleta","Mar Chiquita"], dependencias:["Comisaría Coronel Vidal","Comisaría Santa Clara del Mar","Comisaría de la Mujer Mar Chiquita","Destacamento Mar de Cobo"]},
    "General Alvarado":{ localidades:["Miramar","Mechongué","Comandante N. Otamendi","Mar del Sud"], dependencias:["Comisaría Miramar","Comisaría Otamendi","Comisaría de la Mujer Gral. Alvarado","Destacamento Mar del Sud"]}
  };
  const getCatalogs=()=>{ try{const raw=localStorage.getItem(CATKEY); if(!raw) return structuredClone(DEFAULT_CATALOGS); const parsed=JSON.parse(raw); const cat=structuredClone(DEFAULT_CATALOGS); Object.keys(parsed||{}).forEach(k=>cat[k]=parsed[k]); return cat;}catch{return structuredClone(DEFAULT_CATALOGS);} };
  const setCatalogs=o=>localStorage.setItem(CATKEY, JSON.stringify(o));
  const getCases=()=>{ try{ return JSON.parse(localStorage.getItem(CASEKEY)||"[]"); }catch{ return []; } };
  const setCases=a=>localStorage.setItem(CASEKEY, JSON.stringify(a));
  const freshId=()=> "c_"+Date.now()+"_"+Math.random().toString(36).slice(2,7);

  // Dependent selects
  function fill(select, list, manual=false){ if(!select) return; select.innerHTML=""; select.append(new Option("— Elegir —","")); (list||[]).forEach(v=>select.append(new Option(v,v))); if(manual) select.append(new Option("Escribir manualmente…","__manual__")); }
  function loadLocalidadesAndDeps(){
    const cat=getCatalogs(); const partido=val("g_partido"); const loc=$ID("g_localidad"); const dep=$ID("g_dep");
    if(!partido||!cat[partido]){ fill(loc,[]); fill(dep,[],true); $ID("g_dep_manual_wrap").style.display="none"; return;}
    fill(loc,cat[partido].localidades); fill(dep,cat[partido].dependencias,true);
    $ID("g_dep_manual_wrap").style.display = (val("g_dep")==="__manual__")?"block":"none";
  }
  $ID("g_dep")?.addEventListener("change",()=>{ $ID("g_dep_manual_wrap").style.display=(val("g_dep")==="__manual__")?"block":"none"; renderTitlePreview(); });

  // Stores for lists
  const CIV={store:[], editing:null};
  const FZA={store:[], editing:null};
  const OBJ={store:[], editing:null};

  const TitleCase = HRFMT.TitleCase;

  // Add/update civil
  function civAdd(){
    const p={ nombre:val("c_nombre"), apellido:val("c_apellido"), edad:val("c_edad"), dni:val("c_dni"), pais:val("c_pais"), loc_domicilio:val("c_loc"), calle_domicilio:val("c_calle"), vinculo:val("c_vinculo"), obito:val("c_obito")==="true" };
    if(CIV.editing==null) CIV.store.push(p); else { CIV.store[CIV.editing]=p; CIV.editing=null; $ID("addCivil").textContent="Agregar involucrado"; }
    ["c_nombre","c_apellido","c_edad","c_dni","c_pais","c_loc","c_calle"].forEach(id=>setv(id,"")); setv("c_vinculo","Victima"); setv("c_obito","false"); civRender();
  }
  function civRender(){
    const box=$ID("civilesList");
    if(!CIV.store.length){ box.innerHTML=""; renderTagHelper(); return; }
    box.innerHTML=`<div class="table"><table><thead><tr><th>#</th><th>Vínculo</th><th>Nombre</th><th>Apellido</th><th>Edad</th><th>DNI</th><th>Domicilio</th><th></th></tr></thead><tbody>${
      CIV.store.map((p,i)=>`<tr><td>${i}</td><td>${p.vinculo}</td><td>${TitleCase(p.nombre||"")}</td><td>${TitleCase(p.apellido||"")}</td><td>${p.edad||""}</td><td>${p.dni||""}</td><td>${[TitleCase(p.calle_domicilio||""),TitleCase(p.loc_domicilio||"")].filter(Boolean).join(", ")}</td><td><button class="btn ghost" data-e="${i}">Editar</button> <button class="btn ghost" data-d="${i}">Quitar</button></td></tr>`).join("")}</tbody></table></div>`;
    $$("#civilesList [data-d]").forEach(b=>b.onclick=()=>{ CIV.store.splice(parseInt(b.dataset.d,10),1); civRender(); });
    $$("#civilesList [data-e]").forEach(b=>b.onclick=()=>{ const i=parseInt(b.dataset.e,10),p=CIV.store[i]; ["c_nombre","c_apellido","c_edad","c_dni","c_pais","c_loc","c_calle"].forEach(()=>{}); setv("c_nombre",p.nombre||""); setv("c_apellido",p.apellido||""); setv("c_edad",p.edad||""); setv("c_dni",p.dni||""); setv("c_pais",p.pais||""); setv("c_loc",p.loc_domicilio||""); setv("c_calle",p.calle_domicilio||""); setv("c_vinculo",p.vinculo||"Victima"); setv("c_obito",p.obito?"true":"false"); CIV.editing=i; $ID("addCivil").textContent="Guardar cambios"; });
    renderTagHelper();
  }

  function fzaAdd(){
    const p={ nombre:val("f_nombre"), apellido:val("f_apellido"), edad:val("f_edad"), fuerza:val("f_fuerza"), jerarquia:val("f_jerarquia"), legajo:val("f_legajo"), destino:val("f_destino"), loc_domicilio:val("f_loc"), calle_domicilio:val("f_calle"), vinculo:val("f_vinculo"), obito:val("f_obito")==="true" };
    if(FZA.editing==null) FZA.store.push(p); else { FZA.store[FZA.editing]=p; FZA.editing=null; $ID("addFuerza").textContent="Agregar personal"; }
    ["f_nombre","f_apellido","f_edad","f_fuerza","f_jerarquia","f_legajo","f_destino","f_loc","f_calle"].forEach(id=>setv(id,"")); setv("f_vinculo","Imputado"); setv("f_obito","false"); fzaRender();
  }
  function fzaRender(){
    const box=$ID("fuerzasList");
    if(!FZA.store.length){ box.innerHTML=""; renderTagHelper(); return; }
    box.innerHTML=`<div class="table"><table><thead><tr><th>#</th><th>Vínculo</th><th>Nombre</th><th>Apellido</th><th>Edad</th><th>Fuerza</th><th>Jerarquía</th><th>Destino</th><th></th></tr></thead><tbody>${
      FZA.store.map((p,i)=>`<tr><td>${i}</td><td>${p.vinculo}</td><td>${TitleCase(p.nombre||"")}</td><td>${TitleCase(p.apellido||"")}</td><td>${p.edad||""}</td><td>${p.fuerza||""}</td><td>${p.jerarquia||""}</td><td>${p.destino||""}</td><td><button class="btn ghost" data-e="${i}">Editar</button> <button class="btn ghost" data-d="${i}">Quitar</button></td></tr>`).join("")}</tbody></table></div>`;
    $$("#fuerzasList [data-d]").forEach(b=>b.onclick=()=>{ FZA.store.splice(parseInt(b.dataset.d,10),1); fzaRender(); });
    $$("#fuerzasList [data-e]").forEach(b=>b.onclick=()=>{ const i=parseInt(b.dataset.e,10),p=FZA.store[i]; setv("f_nombre",p.nombre||""); setv("f_apellido",p.apellido||""); setv("f_edad",p.edad||""); setv("f_fuerza",p.fuerza||""); setv("f_jerarquia",p.jerarquia||""); setv("f_legajo",p.legajo||""); setv("f_destino",p.destino||""); setv("f_loc",p.loc_domicilio||""); setv("f_calle",p.calle_domicilio||""); setv("f_vinculo",p.vinculo||"Imputado"); setv("f_obito",p.obito?"true":"false"); FZA.editing=i; $ID("addFuerza").textContent="Guardar cambios"; });
    renderTagHelper();
  }

  function objAdd(){
    const o={ descripcion:val("o_desc"), vinculo:val("o_vinc") };
    if(!(o.descripcion||"").trim()) return;
    if(OBJ.editing==null) OBJ.store.push(o); else { OBJ.store[OBJ.editing]=o; OBJ.editing=null; $ID("addObjeto").textContent="Agregar objeto"; }
    setv("o_desc",""); setv("o_vinc","Secuestro"); objRender();
  }
  function objRender(){
    const box=$ID("objetosList");
    if(!OBJ.store.length){ box.innerHTML=""; renderTagHelper(); return; }
    box.innerHTML=`<div class="table"><table><thead><tr><th>#</th><th>Descripción</th><th>Vínculo</th><th></th></tr></thead><tbody>${
      OBJ.store.map((o,i)=>`<tr><td>${i}</td><td>${o.descripcion}</td><td>${o.vinculo}</td><td><button class="btn ghost" data-e="${i}">Editar</button> <button class="btn ghost" data-d="${i}">Quitar</button></td></tr>`).join("")}</tbody></table></div>`;
    $$("#objetosList [data-d]").forEach(b=>b.onclick=()=>{ OBJ.store.splice(parseInt(b.dataset.d,10),1); objRender(); });
    $$("#objetosList [data-e]").forEach(b=>b.onclick=()=>{ const i=parseInt(b.dataset.e,10),o=OBJ.store[i]; setv("o_desc",o.descripcion||""); setv("o_vinc",o.vinculo||"Secuestro"); OBJ.editing=i; $ID("addObjeto").textContent="Guardar cambios"; });
    renderTagHelper();
  }

  function availableTags(){
    const tags=new Set();
    const all = CIV.store.concat(FZA.store);
    const roles=["victima","imputado","sindicado","denunciante","testigo","pp","aprehendido","detenido","menor","nn","damnificado institucional"];
    roles.forEach(r=>{
      const arr=all.filter(p=>String(p.vinculo||"").toLowerCase()===r);
      for(let i=0;i<arr.length;i++) tags.add(`#${r}:${i}`);
      if(arr.length) tags.add(`#${r}`);
    });
    for(let i=0;i<FZA.store.length;i++) tags.add(`#pf:${i}`);
    if(FZA.store.length) tags.add("#pf");
    ["secuestro","sustraccion","hallazgo","otro"].forEach(cat=>{
      const arr=OBJ.store.filter(o=>String(o.vinculo||"").toLowerCase()===cat);
      for(let i=0;i<arr.length;i++) tags.add(`#${cat}:${i}`);
      if(arr.length) tags.add(`#${cat}`);
    });
    return Array.from(tags);
  }
  function renderTagHelper(){
    const box=$ID("tagHelper"); if(!box) return;
    const tags=availableTags();
    if(!tags.length){ box.innerHTML='<span class="muted">No hay etiquetas disponibles. Cargá personas/objetos para ver sugerencias.</span>'; return; }
    box.innerHTML = tags.map(t=>`<button type="button" class="chip" data-tag="${t}">${t}</button>`).join("");
    $$("#tagHelper [data-tag]").forEach(b=>b.onclick=()=>insertAtCursor($ID("cuerpo"), b.dataset.tag));
  }
  function insertAtCursor(el,text){ const s=el.selectionStart??el.value.length; const e=el.selectionEnd??el.value.length; const before=el.value.slice(0,s); const after=el.value.slice(e); const space = before && !/\s$/.test(before) ? " " : ""; el.value=before+space+text+" "+after; const pos=(before+space+text+" ").length; el.setSelectionRange(pos,pos); el.focus(); }

  function resolvedDep(){ const v=val("g_dep"); return v==="__manual__" ? val("g_dep_manual").trim() : v; }

  function buildSnap(){
    const tipo=val("g_tipoExp")||"PU"; const num=val("g_numExp").trim(); const puFull = num?`${tipo} ${num}`:"";
    return { 
      generales:{ fecha_hora:fmtFecha(), tipoExp:tipo, numExp:num, pu:puFull, partido:val("g_partido"), localidad:val("g_localidad"), dependencia:resolvedDep(), caratula:val("g_car").trim(), subtitulo:val("g_sub").trim(), esclarecido:(val("g_ok")==="si"), ufi:val("g_ufi").trim(), coordenadas:val("g_coord").trim() },
      civiles:CIV.store.slice(), fuerzas:FZA.store.slice(), objetos:OBJ.store.slice(), cuerpo:val("cuerpo")
    };
  }

  function renderTitlePreview(){
    const t = HRFMT.buildAll(buildSnap()).forDocx.titulo;
    const sub = HRFMT.buildAll(buildSnap()).forDocx.subtitulo;
    const ok  = buildSnap().generales.esclarecido;
    $ID("tituloCompuesto").innerHTML = `<strong>${t}</strong>`;
    $ID("subCompuesto").innerHTML = `<span class="badge ${ok?'blue':'red'}"><strong>${sub}</strong></span>`;
  }

  function preview(){ const out = HRFMT.buildAll(buildSnap()); $ID("previewHtml").innerHTML=out.html; return out; }

  // Bind form
  ["g_fecha_dia","g_numExp","g_tipoExp","g_car","g_sub","g_ok","g_ufi","g_coord","g_dep_manual"].forEach(id=>{ const n=$ID(id); if(n) n.addEventListener("input",renderTitlePreview); });
  $ID("g_partido").addEventListener("change",()=>{ loadLocalidadesAndDeps(); renderTitlePreview(); });
  $ID("g_localidad").addEventListener("change",renderTitlePreview);
  $ID("addCivil").onclick = civAdd;
  $ID("addFuerza").onclick = fzaAdd;
  $ID("addObjeto").onclick = objAdd;
  $ID("generar").onclick = preview;
  document.addEventListener("keydown",(e)=>{ if(e.ctrlKey && e.key==="Enter"){ e.preventDefault(); preview(); } });

  $ID("copiarWA").onclick = ()=>{ window.WA_MERGE_SOFTBREAKS = !!$ID("wa_merge").checked; const out = preview(); navigator.clipboard.writeText(out.waLong).then(()=>alert("Copiado para WhatsApp")); };
  $ID("descargarWord").onclick = async ()=>{ try{ await HRFMT.downloadDocx(buildSnap(), (window.docx||{})); }catch(e){ showErr(e.message||e); } };
  $ID("exportCSV1").onclick = ()=> HRFMT.downloadCSV([buildSnap()]);

  $ID("clearAll").onclick = ()=>{
    if(!confirm("¿Borrar todos los campos del formulario actual?")) return;
    ["g_fecha_dia","g_numExp","g_car","g_sub","g_ufi","g_coord"].forEach(id=>setv(id,"")); setv("g_tipoExp","PU"); setv("g_partido",""); loadLocalidadesAndDeps(); setv("g_dep",""); setv("g_dep_manual",""); setv("g_localidad",""); setv("g_ok","no");
    CIV.store=[]; FZA.store=[]; OBJ.store=[]; civRender(); fzaRender(); objRender(); setv("cuerpo",""); renderTitlePreview(); renderTagHelper();
  };

  // Cases list + search + select many
  function renderCases(){
    const box=$ID("casesList"); const cases=getCases();
    if(!cases.length){ box.innerHTML="Sin hechos guardados."; return; }
    box.innerHTML=`<table><thead><tr><th></th><th></th><th>Nombre</th><th>Fecha</th><th>Tipo</th><th>Número</th><th>Partido</th><th>Dep.</th></tr></thead><tbody>${
      cases.map(c=>`<tr><td><input type="checkbox" class="caseCheck" data-id="${c.id}"></td><td><input type="radio" name="caseSel" data-id="${c.id}"></td><td>${c.name||''}</td><td>${c.generales?.fecha_hora||''}</td><td>${c.generales?.tipoExp||''}</td><td>${c.generales?.numExp||''}</td><td>${c.generales?.partido||''}</td><td>${c.generales?.dependencia||''}</td></tr>`).join("")}</tbody></table>`;
  }
  function selectedRadio(){ const r=document.querySelector('input[name="caseSel"]:checked'); return r?r.getAttribute("data-id"):null; }
  function selectedChecks(){ return $$(".caseCheck:checked").map(x=>x.getAttribute("data-id")); }
  function attachCaseSearch(){ const input=$ID("caseSearch"); const box=$ID("casesList"); input.oninput=()=>{ const q=input.value.toLowerCase(); box.querySelectorAll("tbody tr").forEach(tr=>{ tr.style.display = tr.textContent.toLowerCase().includes(q)? "": "none"; }); }; }

  $ID("saveCase").onclick=()=>{ const name=(val("caseName")||"").trim() || HRFMT.buildAll(buildSnap()).forDocx.titulo; const snap=buildSnap(); snap.id=freshId(); snap.name=name; const cases=getCases(); cases.push(snap); setCases(cases); renderCases(); alert("Guardado."); };
  $ID("updateCase").onclick=()=>{ const id=selectedRadio(); if(!id) return alert("Elegí un hecho (radio)."); const idx=getCases().findIndex(c=>c.id===id); if(idx<0) return; const cases=getCases(); const snap=buildSnap(); snap.id=id; snap.name=(val("caseName")||"").trim()||HRFMT.buildAll(snap).forDocx.titulo; cases[idx]=snap; setCases(cases); renderCases(); alert("Actualizado."); };
  $ID("deleteCase").onclick=()=>{ const id=selectedRadio(); if(!id) return alert("Elegí un hecho (radio)."); const cases=getCases().filter(c=>c.id!==id); setCases(cases); renderCases(); };
  $ID("loadSelected").onclick=()=>{ const id=selectedRadio(); if(!id) return alert("Elegí un hecho (radio)."); const c=getCases().find(x=>x.id===id); if(!c) return; loadSnap(c); renderCases(); preview(); alert("Cargado."); };

  $ID("exportCSV").onclick=()=>{ const ids=selectedChecks(); const list=ids.length? getCases().filter(c=>ids.includes(c.id)) : getCases().filter(c=> (c.name||"").toLowerCase().includes(val("caseSearch").toLowerCase())); HRFMT.downloadCSV(list); };
  $ID("downloadWordMulti").onclick=async ()=>{
    const ids=selectedChecks(); const list=ids.length? getCases().filter(c=>ids.includes(c.id)) : getCases().filter(c=> (c.name||"").toLowerCase().includes(val("caseSearch").toLowerCase()));
    if(!list.length) return alert("No hay hechos para exportar.");
    const { Document,Packer,TextRun,Paragraph,AlignmentType } = (window.docx||{}); if(!Document){ showErr("docx no cargada"); return; }
    const JUST=AlignmentType.JUSTIFIED;
    const toRuns=html=>{ const parts=(html||"").split(/(<\/?strong>|<\/?em>|<\/?u>)/g); let B=false,I=false,U=false,r=[]; for(const part of parts){ if(part==="<strong>"){B=true;continue;} if(part==="</strong>"){B=false;continue;} if(part==="<em>"){I=true;continue;} if(part==="</em>"){I=false;continue;} if(part==="<u>"){U=true;continue;} if(part==="</u>"){U=false;continue;} if(part){ r.push(new TextRun({text:part,bold:B,italics:I,underline:U?{}:undefined})); } } return r; };
    const children=[];
    list.forEach((snap,i)=>{ const built=HRFMT.buildAll(snap); children.push(new Paragraph({children:[new TextRun({text:built.forDocx.titulo,bold:true})]})); children.push(new Paragraph({children:[new TextRun({text:built.forDocx.subtitulo,bold:true,color:built.forDocx.color})]})); (built.forDocx.bodyHtml||"").split(/\n\n+/).forEach(p=> children.push(new Paragraph({children:toRuns(p),alignment:JUST,spacing:{after:200}}))); if(i!==list.length-1) children.push(new Paragraph({text:""})); });
    const doc=new Document({ styles:{default:{document:{run:{font:"Arial",size:24},paragraph:{spacing:{after:120}}}}}, sections:[{children}] });
    const blob=await Packer.toBlob(doc); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`Hechos_Seleccionados_${new Date().toISOString().slice(0,10)}.docx`; a.click();
  };
  $ID("copyWAMulti").onclick=()=>{
    const ids=selectedChecks(); const list=ids.length? getCases().filter(c=>ids.includes(c.id)) : getCases().filter(c=> (c.name||"").toLowerCase().includes(val("caseSearch").toLowerCase()));
    if(!list.length) return alert("No hay hechos para copiar.");
    window.WA_MERGE_SOFTBREAKS=false;
    const txt = list.map(s=>HRFMT.buildAll(s).waLong).join("\n\n");
    navigator.clipboard.writeText(txt).then(()=>alert("Copiado para WhatsApp (multi)."));
  };

  function loadSnap(s){
    const fh=s.generales?.fecha_hora||""; const m=/^(\d{2})-(\d{2})-(\d{4})$/.exec(fh); if(m) setv("g_fecha_dia",`${m[3]}-${m[2]}-${m[1]}`); else setv("g_fecha_dia","");
    setv("g_tipoExp", s.generales?.tipoExp||"PU"); setv("g_numExp", s.generales?.numExp||"");
    setv("g_partido", s.generales?.partido||""); loadLocalidadesAndDeps(); setv("g_localidad", s.generales?.localidad||"");
    const cat=getCatalogs(); const deps=(cat[s.generales?.partido||""]?.dependencias||[]);
    if(s.generales?.dependencia && !deps.includes(s.generales.dependencia)){ setv("g_dep","__manual__"); setv("g_dep_manual", s.generales.dependencia); $ID("g_dep_manual_wrap").style.display="block"; } else { setv("g_dep", s.generales?.dependencia||""); $ID("g_dep_manual_wrap").style.display=(val("g_dep")==="__manual__")?"block":"none"; }
    setv("g_car", s.generales?.caratula||""); setv("g_sub", s.generales?.subtitulo||""); setv("g_ok", s.generales?.esclarecido? "si":"no"); setv("g_ufi", s.generales?.ufi||""); setv("g_coord", s.generales?.coordenadas||"");
    CIV.store=(s.civiles||[]).slice(); FZA.store=(s.fuerzas||[]).slice(); OBJ.store=(s.objetos||[]).slice(); civRender(); fzaRender(); objRender(); setv("cuerpo", s.cuerpo||"");
    renderTitlePreview(); renderTagHelper();
  }

  // Backup / restore / merge
  function exportBackup(){ const payload={version:1, exported_at:new Date().toISOString(), cases:getCases()}; const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`hechos_backup_${new Date().toISOString().slice(0,10)}.json`; a.click(); }
  async function importBackup(file, replace=false){ try{ const txt=await file.text(); const data=JSON.parse(txt); const incoming=Array.isArray(data?.cases)?data.cases:(Array.isArray(data)?data:null); if(!incoming) return alert("JSON inválido."); if(replace){ setCases(incoming); renderCases(); return; } const current=getCases(); const ids=new Set(current.map(c=>c.id)); let added=0,skip=0; incoming.forEach(it=>{ if(!it||typeof it!=="object"){skip++;return;} if(!it.id) it.id=freshId(); if(ids.has(it.id)){skip++;} else { current.push(it); ids.add(it.id); added++; } }); setCases(current); renderCases(); alert(`Fusión: +${added}, duplicados ${skip}.`); }catch(e){ alert("No se pudo leer el JSON."); } }
  $ID("backupJSON").onclick=exportBackup;
  $ID("restoreJSON").onclick=()=>{ const i=$ID("restoreFile"); i.value=""; i.click(); i.onchange=()=>{ if(i.files?.[0]) importBackup(i.files[0], true); }; };
  $ID("mergeJSON").onclick=()=>{ const i=$ID("mergeFile"); i.value=""; i.click(); i.onchange=()=>{ if(i.files?.[0]) importBackup(i.files[0], false); }; };

  // Catalog editor
  function cat_load(){ const cat=getCatalogs(); const partido=val("cat_partidoSel")||"General Pueyrredon"; $ID("cat_localidades").value=(cat[partido]?.localidades||[]).join("\n"); $ID("cat_dependencias").value=(cat[partido]?.dependencias||[]).join("\n"); }
  $ID("cat_partidoSel").addEventListener("change", cat_load);
  $ID("cat_guardar").onclick=()=>{ const partido=val("cat_partidoSel")||"General Pueyrredon"; const cat=getCatalogs(); cat[partido]={ localidades:$ID("cat_localidades").value.split("\n").map(s=>s.trim()).filter(Boolean), dependencias:$ID("cat_dependencias").value.split("\n").map(s=>s.trim()).filter(Boolean) }; setCatalogs(cat); if(val("g_partido")===partido) loadLocalidadesAndDeps(); alert("Catálogo guardado."); };
  $ID("cat_reset").onclick=()=>{ setCatalogs(DEFAULT_CATALOGS); cat_load(); if(val("g_partido")) loadLocalidadesAndDeps(); };

  // Init
  document.addEventListener("DOMContentLoaded", ()=>{
    loadLocalidadesAndDeps(); renderTitlePreview(); renderTagHelper(); renderCases(); attachCaseSearch();
  });
})();