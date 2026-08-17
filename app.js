const initialUnits = [
  {id:'A52',name:'A52',agency:'MCSO',type:'Patrol',agencyType:'POLICE',tab:'available',status:'ACTIVE',address:'120 Main St',shift:'Started 38 min ago',crew:['523 J. Miller'],vehicles:['Unit 52'],offBehavior:'AVAILABLE'},
  {id:'B25',name:'B25',agency:'MCSO',type:'Patrol',agencyType:'POLICE',tab:'available',status:'ACTIVE',address:'85 Church Ave',shift:'Started 42 min ago',crew:['411 A. Torres'],vehicles:['Unit 25'],offBehavior:'AVAILABLE'},
  {id:'1001',name:'1001 – Police Car',agency:'MPD',type:'Patrol',agencyType:'POLICE',tab:'available',status:'ACTIVE',address:'300 Broadway',shift:'Started 1 hr ago',crew:['291 D. Carter'],vehicles:['Police Car 1001'],offBehavior:'AVAILABLE'},
  {id:'1002',name:'1002 – Fire Truck',agency:'MFD',type:'Fire',agencyType:'FIRE',tab:'available',status:'ACTIVE',address:'Fire Station 1',shift:'Started 54 min ago',crew:['F12 R. Evans'],vehicles:['Engine 1002'],offBehavior:'STANDBY',isStandbyWhenOffDuty:true},
  {id:'FL004',name:'FL 004',agency:'MFD',type:'Fire',agencyType:'FIRE',tab:'assigned',status:'ASSIGNED',address:'440 9th St',cfs:'CFS2507027',shift:'Started 47 min ago',crew:['F18 S. Lewis'],vehicles:['Truck 4'],offBehavior:'STANDBY'},
  {id:'FL008',name:'FL 008',agency:'MFD',type:'Fire',agencyType:'FIRE',tab:'assigned',status:'ON_SCENE',address:'440 9th St',cfs:'CFS2507027',shift:'Started 49 min ago',crew:['F22 N. Green'],vehicles:['Engine 8'],offBehavior:'STANDBY'},
  {id:'K911',name:'K9 11',agency:'MCSO',type:'K9',agencyType:'POLICE',tab:'assigned',status:'EN_ROUTE',address:'440 9th St',cfs:'CFS2507027',shift:'Started 31 min ago',crew:['K11 P. Stone'],vehicles:['K9 11'],offBehavior:'AVAILABLE'}
];

const STATUS_LABELS={ACTIVE:'Active',QUEUED:'Queued',ASSIGNED:'Assigned',EN_ROUTE:'En Route',ON_SCENE:'On Scene',IN_THE_AREA:'In the Area',PROGRESS:'In Progress',STANDBY:'Standby'};
const STATUS_STEPS=[['ASSIGNED','Assigned'],['EN_ROUTE','En Route'],['ON_SCENE','On Scene'],['IN_THE_AREA','In Area'],['PROGRESS','In Progress']];
const STRIPES={POLICE:'#60a5fa',FIRE:'#f97316',EMS:'#ef4444'};
const GRADIENTS={POLICE:'rgba(96,165,250,.26)',FIRE:'rgba(249,115,22,.25)',EMS:'rgba(239,68,68,.24)'};

let units=[];
let state={activeTab:'available',selected:null,groups:{},dragId:null,search:'',filter:'all',context:'details',statusFilter:[]};
let logs=[];

const $=s=>document.querySelector(s);
const list=$('#units-list'), tabs=$('#unit-tabs'), search=$('#unit-search'), toast=$('#toast'), dragMessage=$('#drag-message'), statusFilterWrap=$('#status-filter-wrap');

function resetState(){
  units=structuredClone(initialUnits);
  state={activeTab:'available',selected:null,groups:{},dragId:null,search:'',filter:'all',context:'details',statusFilter:[]};
  logs=[];
  search.value='';
  document.querySelectorAll('.filter-option').forEach(x=>x.classList.toggle('active',x.dataset.filter==='all'));
  document.querySelectorAll('[data-context]').forEach(x=>x.classList.toggle('active',x.dataset.context==='details'));
  $('#context-note').textContent='CFS details · Units';
  addLog('Prototype reset.');
  render();
}
function getUnit(id){return units.find(u=>u.id===id)}
function parentOf(id){for(const [top,children] of Object.entries(state.groups)){if(children.includes(id))return top}return null}
function rootOf(id){return parentOf(id)||id}
function rootsForTab(){
  const q=state.search.trim().toLowerCase();
  return units.filter(u=>u.tab===state.activeTab&&!parentOf(u.id))
    .filter(u=>state.filter==='all'||u.agencyType.toLowerCase()===state.filter)
    .filter(u=>!state.statusFilter.length||state.statusFilter.includes(u.status))
    .filter(u=>!q||[u.name,u.agency,u.type,u.address,u.status,u.cfs].filter(Boolean).join(' ').toLowerCase().includes(q));
}
function childrenOf(id){return (state.groups[id]||[]).map(getUnit).filter(Boolean)}
function countRoots(tab){return units.filter(u=>u.tab===tab&&!parentOf(u.id)).length}
function syncCounts(){ $('#available-count').textContent=countRoots('available'); $('#assigned-count').textContent=countRoots('assigned') }
function syncTabs(){
  tabs.querySelectorAll('.lifted-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.activeTab));
  $('.active-dot').style.left=state.activeTab==='available'?'25%':'75%';
}
function renderStatusFilter(){
  if(state.activeTab==='available'){statusFilterWrap.innerHTML='';return}
  const options=STATUS_STEPS.map(([value,label])=>`<button class="status-chip ${state.statusFilter.includes(value)?'active':''}" data-status-filter="${value}">${label}</button>`).join('');
  statusFilterWrap.innerHTML=`<button class="compact-select" id="status-filter-button">Filter by status <svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"></path></svg></button><div class="compact-menu">${options}</div>`;
}
function rowSummary(u,sub,childCount){
  const badge=`<span class="status-badge status-${u.status}">${STATUS_LABELS[u.status]||u.status}</span>`;
  const group=(!sub&&childCount)?`<span class="group-count">${childCount+1} units</span>`:'';
  return `<div class="unit-summary"><div class="unit-top-line"><span class="unit-name">${escapeHtml(u.name)}<span class="unit-meta"> · ${escapeHtml(u.agency)} · ${escapeHtml(u.type)}</span></span>${group}${badge}</div><div class="unit-address">${escapeHtml(u.address||'Offline')}</div></div>`;
}
function fields(u){
  return `<dl class="unit-fields">${u.cfs?`<dt>Call</dt><dd>${escapeHtml(u.cfs)}</dd>`:''}<dt>Shift</dt><dd>${escapeHtml(u.shift)}</dd>${u.isStandbyWhenOffDuty?'<dt>Standby</dt><dd>Available when off duty</dd>':''}<dt>Crew</dt><dd>${u.crew.map(x=>`<p>${escapeHtml(x)}</p>`).join('')}</dd><dt>Vehicles</dt><dd>${u.vehicles.map(x=>`<p>${escapeHtml(x)}</p>`).join('')}</dd></dl>`;
}
function activeActions(u,sub){
  if(sub)return `<div class="action-row"><span class="subunit-helper">Controlled by top unit</span><button class="button-xs destructive-ghost" data-action="ungroup-one" data-id="${u.id}">Ungroup</button></div>`;
  const grouped=childrenOf(u.id).length>0;
  return `<div class="action-row"><button class="button-xs ghost first">Edit resources</button><button class="button-xs ghost">Set Off Duty</button>${grouped?`<button class="button-xs destructive-ghost" data-action="ungroup-all" data-id="${u.id}">Ungroup</button>`:''}<button class="button-xs" data-action="assign" data-id="${u.id}">Assign to CFS</button></div>`;
}
function assignedActions(u,sub){
  if(sub)return `<div class="action-row"><span class="subunit-helper">Controlled by top unit</span><button class="button-xs destructive-ghost" data-action="ungroup-one" data-id="${u.id}">Ungroup</button></div>`;
  const currentIndex=STATUS_STEPS.findIndex(([s])=>s===u.status);
  const stepHtml=STATUS_STEPS.map(([s,label],i)=>`<button class="${i===currentIndex?'current':i<currentIndex?'past':''}" ${i===currentIndex?'disabled':''} data-action="status" data-id="${u.id}" data-status="${s}">${label}</button>`).join('');
  const grouped=childrenOf(u.id).length>0;
  return `<div class="stepper-wrap"><div class="stepper" role="group" aria-label="Assignment status">${stepHtml}</div><div class="fade-divider"></div><div class="action-row"><button class="button-xs ghost first">Edit resources</button><button class="button-xs destructive-ghost" data-action="cancel" data-id="${u.id}">Cancel</button>${grouped?`<button class="button-xs destructive-ghost" data-action="ungroup-all" data-id="${u.id}">Ungroup</button>`:''}<button class="button-xs" data-action="complete" data-id="${u.id}">Complete</button></div></div>`;
}
function unitItem(u,{sub=false}={}){
  const selected=state.selected===u.id;
  const childCount=childrenOf(u.id).length;
  return `<article class="unit-item ${selected?'selected':''} ${sub?'subunit':''}" draggable="true" data-id="${u.id}" style="--stripe:${STRIPES[u.agencyType]||'#d4d4d8'};--gradient:${GRADIENTS[u.agencyType]||'rgba(161,161,170,.3)'}">
    <button class="unit-header" data-action="toggle" data-id="${u.id}" aria-expanded="${selected}">${rowSummary(u,sub,childCount)}<svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></button>
    <div class="unit-expanded"><div class="fields-pad">${fields(u)}</div><div class="fade-divider"></div><div class="actions-pad">${u.tab==='available'?activeActions(u,sub):assignedActions(u,sub)}</div></div>
  </article>`;
}
function render(){
  syncTabs();syncCounts();renderStatusFilter();
  const roots=rootsForTab();
  list.innerHTML=roots.length?roots.map(u=>{const children=childrenOf(u.id);return `<section class="unit-group">${unitItem(u)}${children.length?`<div class="group-children">${children.map(c=>unitItem(c,{sub:true})).join('')}<div class="group-footer"><button data-action="ungroup-all" data-id="${u.id}">Ungroup all</button></div></div>`:''}</section>`}).join(''):'<div class="empty-state">No units</div>';
  wireDrag(); renderLogs();
}
function wireDrag(){
  list.querySelectorAll('.unit-item').forEach(card=>{
    card.addEventListener('dragstart',e=>{state.dragId=card.dataset.id;card.classList.add('dragging');dragMessage.hidden=false;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('application/json',JSON.stringify({uuid:state.dragId,name:getUnit(state.dragId)?.name}))});
    card.addEventListener('dragend',()=>{state.dragId=null;dragMessage.hidden=true;document.querySelectorAll('.dragging,.drop-target').forEach(x=>x.classList.remove('dragging','drop-target'))});
    card.addEventListener('dragover',e=>{if(!state.dragId||state.dragId===card.dataset.id)return;e.preventDefault();card.classList.add('drop-target')});
    card.addEventListener('dragleave',()=>card.classList.remove('drop-target'));
    card.addEventListener('drop',e=>{e.preventDefault();card.classList.remove('drop-target');if(state.dragId&&state.dragId!==card.dataset.id)groupUnits(state.dragId,card.dataset.id)});
  });
}
function groupUnits(draggedId,targetId){
  const top=rootOf(targetId); if(top===draggedId||parentOf(draggedId)===top)return;
  const dragged=getUnit(draggedId), target=getUnit(top); if(!dragged||!target)return;
  const carried=[...(state.groups[draggedId]||[])];
  detachFromParent(draggedId,false,false);
  state.groups[top]=[...(state.groups[top]||[]),draggedId,...carried].filter((v,i,a)=>a.indexOf(v)===i&&v!==top);
  delete state.groups[draggedId];
  [draggedId,...carried].forEach(id=>inheritFromTop(getUnit(id),target));
  state.selected=null;
  addLog(`${dragged.name} became a sub-unit of ${target.name}.`);
  showToast(`${dragged.name} grouped under ${target.name}`); render();
}
function inheritFromTop(u,top){if(!u)return;u.tab=top.tab;u.status=top.status;u.address=top.address;u.cfs=top.cfs}
function detachFromParent(id,restore=true,notify=true){
  const parent=parentOf(id); if(!parent)return;
  state.groups[parent]=state.groups[parent].filter(x=>x!==id); if(!state.groups[parent].length)delete state.groups[parent];
  if(restore)restoreOriginalBehavior(getUnit(id));
  if(notify){addLog(`${getUnit(id)?.name||id} was ungrouped.`);showToast(`${getUnit(id)?.name||id} ungrouped`)}
}
function restoreOriginalBehavior(u){if(!u)return;if(u.offBehavior==='STANDBY'){u.tab='off-duty';u.status='STANDBY';u.address='Offline';delete u.cfs}else{u.tab='available';u.status='ACTIVE';u.address=u.id==='1001'?'300 Broadway':u.address||'Offline';delete u.cfs}}
function ungroupAll(topId){const childIds=[...(state.groups[topId]||[])];childIds.forEach(id=>detachFromParent(id,true,false));delete state.groups[topId];addLog(`All sub-units were ungrouped from ${getUnit(topId)?.name||topId}.`);showToast('Group ungrouped');render()}
function assignGroup(id){
  const topId=rootOf(id), top=getUnit(topId), childIds=state.groups[topId]||[]; if(!top)return;
  [topId,...childIds].forEach(uid=>{const u=getUnit(uid);u.tab='assigned';u.status='ASSIGNED';u.cfs='CFS2507027';u.address='440 9th St'});
  state.activeTab='assigned';state.selected=topId;
  const childText=childIds.length?` with sub-unit${childIds.length>1?'s':''} ${childIds.map(x=>getUnit(x)?.name||x).join(', ')}`:'';
  addLog(`${top.name}${childText} was assigned to CFS2507027.`);showToast('Group assigned to CFS2507027');render();
}
function setGroupStatus(id,status){
  const topId=rootOf(id), ids=[topId,...(state.groups[topId]||[])]; ids.forEach(uid=>{const u=getUnit(uid);if(u){u.status=status;u.tab='assigned';u.cfs='CFS2507027';u.address='440 9th St'}});
  addLog(`${getUnit(topId)?.name||topId}${ids.length>1?' and its sub-units':''} changed to ${STATUS_LABELS[status]}.`);render();
}
function completeGroup(id){
  const topId=rootOf(id), ids=[topId,...(state.groups[topId]||[])];ids.forEach(uid=>{const u=getUnit(uid);u.tab='available';u.status='ACTIVE';delete u.cfs});state.activeTab='available';state.selected=topId;addLog(`${getUnit(topId)?.name||topId}${ids.length>1?' and its group':''} completed the assignment and moved to Available.`);showToast('Assignment completed');render();
}
function closeCfs(){
  const assignedRoots=units.filter(u=>u.tab==='assigned'&&!parentOf(u.id));
  assignedRoots.forEach(top=>{const ids=[top.id,...(state.groups[top.id]||[])];ids.forEach(uid=>{const u=getUnit(uid);u.tab='available';u.status='ACTIVE';delete u.cfs});if((state.groups[top.id]||[]).length)addLog(`CFS2507027 closed: ${top.name} and its grouped sub-units moved together to Available.`)});
  state.activeTab='available';state.selected=null;showToast('CFS closed · grouped units moved together');render();
}
function cancelGroup(id){const topId=rootOf(id),ids=[topId,...(state.groups[topId]||[])];ids.forEach(uid=>{const u=getUnit(uid);u.tab='available';u.status='ACTIVE';delete u.cfs});state.activeTab='available';addLog(`${getUnit(topId)?.name||topId}${ids.length>1?' and its group':''} canceled the assignment.`);render()}
function addLog(message){logs.unshift({message,time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})})}
function renderLogs(){const el=$('#log-list');el.innerHTML=logs.length?logs.map(x=>`<div class="log-row"><strong>${escapeHtml(x.message)}</strong><span class="log-time">${x.time}</span></div>`).join(''):'<div class="log-row">No prototype events yet.</div>'}
function showToast(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),2100)}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

list.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const {action,id,status}=b.dataset;if(action==='toggle'){state.selected=state.selected===id?null:id;render()}else if(action==='ungroup-one'){detachFromParent(id,true,true);state.selected=null;render()}else if(action==='ungroup-all')ungroupAll(id);else if(action==='assign')assignGroup(id);else if(action==='status')setGroupStatus(id,status);else if(action==='complete')completeGroup(id);else if(action==='cancel')cancelGroup(id)});
tabs.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;state.activeTab=b.dataset.tab;state.selected=null;state.statusFilter=[];render()});
search.addEventListener('input',e=>{state.search=e.target.value;render()});
statusFilterWrap.addEventListener('click',e=>{const b=e.target.closest('[data-status-filter]');if(!b)return;const s=b.dataset.statusFilter;state.statusFilter=state.statusFilter.includes(s)?state.statusFilter.filter(x=>x!==s):[...state.statusFilter,s];render()});
$('#filter-button').addEventListener('click',()=>{const p=$('#filter-popover');p.hidden=!p.hidden;$('#filter-button').setAttribute('aria-expanded',String(!p.hidden))});
$('#filter-popover').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;state.filter=b.dataset.filter;document.querySelectorAll('.filter-option').forEach(x=>x.classList.toggle('active',x===b));render()});
document.querySelectorAll('[data-context]').forEach(btn=>btn.addEventListener('click',()=>{state.context=btn.dataset.context;document.querySelectorAll('[data-context]').forEach(x=>x.classList.toggle('active',x===btn));$('#context-note').textContent=`${state.context==='details'?'CFS details':'Map view'} · Units`;addLog(`Switched prototype context to ${state.context==='details'?'CFS details':'Map view'}.`);renderLogs()}));
$('#close-cfs').addEventListener('click',closeCfs);$('#reset-demo').addEventListener('click',resetState);
resetState();
