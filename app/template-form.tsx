'use client';
import { Plus, X } from 'lucide-react';
import type { MethodTemplate, TemplateData, TemplateField } from '@/lib/templates';
import { cellKey, labels, weightedTotals } from '@/lib/templates';

type Change=(id:string,value:TemplateData[string])=>void;
const asText=(v:unknown)=>typeof v==='string'?v:'';
const asList=(v:unknown)=>Array.isArray(v)?(v as unknown[]).filter((x):x is string=>typeof x==='string'):[];
const asRows=(v:unknown)=>Array.isArray(v)?(v as unknown[]).filter((x):x is Record<string,string>=>!!x&&typeof x==='object'):[];
const asGrid=(v:unknown)=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,string>:{};

function ListInput({field,value,onChange,readonly}:{field:TemplateField;value:string[];onChange:(v:string[])=>void;readonly:boolean}) {
 const items=readonly?value.filter(v=>v.trim()):value.length?value:[''];
 if(readonly)return items.length?<ul className="template-list">{items.map((v,i)=><li key={i}>{v}</li>)}</ul>:<p className="template-empty">Not filled in.</p>;
 return <div className="template-list-edit">{items.map((v,i)=><div className="list-row" key={i}><input value={v} aria-label={`${field.label} ${i+1}`} placeholder={'placeholder' in field?field.placeholder:undefined} onChange={e=>onChange(items.map((x,j)=>j===i?e.target.value:x))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();const list=e.currentTarget.closest('.template-list-edit');onChange([...items.slice(0,i+1),'',...items.slice(i+1)]);requestAnimationFrame(()=>list?.querySelectorAll('input')[i+1]?.focus());}}}/><button type="button" className="icon-button" aria-label={`Remove ${field.label} ${i+1}`} onClick={()=>onChange(items.filter((_,j)=>j!==i))}><X size={16}/></button></div>)}<button type="button" className="text-button" onClick={()=>onChange([...items,''])}><Plus size={16}/>Add</button></div>;
}

function TableInput({field,value,onChange,readonly}:{field:Extract<TemplateField,{kind:'table'}>;value:Record<string,string>[];onChange:(v:Record<string,string>[])=>void;readonly:boolean}) {
 const rows=readonly?value.filter(r=>Object.values(r).some(c=>c?.trim())):value.length?value:[{}];
 if(readonly&&!rows.length)return <p className="template-empty">Not filled in.</p>;
 const set=(i:number,col:string,v:string)=>onChange(rows.map((r,j)=>j===i?{...r,[col]:v}:r));
 return <div className="template-table-wrap"><table className="template-table"><thead><tr>{field.columns.map(c=><th key={c.id} scope="col">{c.label}</th>)}{readonly?null:<th aria-label="Row actions"/>}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{field.columns.map(c=><td key={c.id}>{readonly?r[c.id]??'':c.options?<select aria-label={`${c.label}, row ${i+1}`} value={r[c.id]??''} onChange={e=>set(i,c.id,e.target.value)}><option value="">–</option>{c.options.map(o=><option key={o}>{o}</option>)}</select>:<textarea rows={1} aria-label={`${c.label}, row ${i+1}`} value={r[c.id]??''} onChange={e=>set(i,c.id,e.target.value)}/>}</td>)}{readonly?null:<td className="row-action"><button type="button" className="icon-button" aria-label={`Remove row ${i+1}`} onClick={()=>onChange(rows.filter((_,j)=>j!==i))}><X size={16}/></button></td>}</tr>)}</tbody></table>{readonly?null:<button type="button" className="text-button" onClick={()=>onChange([...rows,{}])}><Plus size={16}/>Add row</button>}</div>;
}

function GridInput({field,data,onChange,readonly}:{field:Extract<TemplateField,{kind:'grid'}>;data:TemplateData;onChange:(v:Record<string,string>)=>void;readonly:boolean}) {
 const rows=labels(field.rows,data),cols=labels(field.columns,data),grid=asGrid(data[field.id]);const totals=weightedTotals(field,data);
 if(!rows.length||!cols.length)return <p className="template-empty">{readonly?'Not filled in.':'Fill in the rows and columns above first; the grid builds itself from them.'}</p>;
 const set=(r:string,c:string,v:string)=>onChange({...grid,[cellKey(r,c)]:v});
 return <div className="template-table-wrap"><table className="template-table grid"><thead><tr><th/>{cols.map(c=><th key={c} scope="col">{c}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r}><th scope="row">{r}</th>{cols.map(c=>{const v=grid[cellKey(r,c)]??'';return <td key={c}>{readonly?v:field.options?<select aria-label={`${r} · ${c}`} value={v} onChange={e=>set(r,c,e.target.value)}><option value="">–</option>{field.options.map(o=><option key={o}>{o}</option>)}</select>:<input type="number" inputMode="decimal" min={field.numeric?.min} max={field.numeric?.max} aria-label={`${r} · ${c}`} value={v} onChange={e=>set(r,c,e.target.value)}/>}</td>;})}</tr>)}{totals?<tr className="totals"><th scope="row">Weighted total</th>{totals.map((t,i)=><td key={i}>{Math.round(t*100)/100}</td>)}</tr>:null}</tbody></table></div>;
}

export function TemplateFields({template,data,onChange,readonly=false}:{template:MethodTemplate;data:TemplateData;onChange?:Change;readonly?:boolean}) {
 const change:Change=onChange??(()=>{});
 return <div className={`template-fields ${readonly?'readonly':''}`}>{template.fields.map(f=><section className="template-field" key={f.id}>
  <h4 id={`tf-${f.id}`}>{f.label}</h4>{f.hint&&!readonly?<p className="template-hint">{f.hint}</p>:null}
  {f.kind==='text'?readonly?<p className="template-text">{asText(data[f.id])||<span className="template-empty">Not filled in.</span>}</p>:<input aria-labelledby={`tf-${f.id}`} value={asText(data[f.id])} onChange={e=>change(f.id,e.target.value)}/>
  :f.kind==='longtext'?readonly?<p className="template-text">{asText(data[f.id])||<span className="template-empty">Not filled in.</span>}</p>:<textarea aria-labelledby={`tf-${f.id}`} rows={3} value={asText(data[f.id])} onChange={e=>change(f.id,e.target.value)}/>
  :f.kind==='list'?<ListInput field={f} value={asList(data[f.id])} onChange={v=>change(f.id,v)} readonly={readonly}/>
  :f.kind==='table'?<TableInput field={f} value={asRows(data[f.id])} onChange={v=>change(f.id,v)} readonly={readonly}/>
  :<GridInput field={f} data={data} onChange={v=>change(f.id,v)} readonly={readonly}/>}
 </section>)}</div>;
}

