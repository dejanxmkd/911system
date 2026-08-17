const calls=[
  ['CFS2507027','440 9th St','New'],['CFS2507026','12 Oakwood St','New'],['CFS2507025','118 Center Ave','In progress'],['CFS2507024','64 Riverside Dr','New'],['CFS2507023','8 Franklin Ave','In progress'],['CFS2507022','299 Jefferson St','In progress'],['CFS2507021','41 Hill Rd','New']
];
const units=[
  {id:'A52',name:'A52',agency:'MCSO',type:'Patrol',tab:'available',status:'ACTIVE',address:'120 Main St',crew:'523 J. Miller',vehicle:'Unit 52',offBehavior:'AVAILABLE'},
  {id:'B25',name:'B25',agency:'MCSO',type:'Patrol',tab:'available',status:'ACTIVE',address:'85 Church Ave',crew:'411 A. Torres',vehicle:'Unit 25',offBehavior:'AVAILABLE'},
  {id:'1001',name:'1001 – Police Car',agency:'MPD',type:'Patrol',tab:'available',status:'ACTIVE',address:'300 Broadway',crew:'291 D. Carter',vehicle:'Police Car 1001',offBehavior:'AVAILABLE'},
  {id:'1002',name:'1002 – Fire Truck',agency:'MFD',type:'Fire',tab:'available',status:'ACTIVE',address:'Fire Station 1',crew:'F12 R. Evans',vehicle:'Engine 1002',offBehavior:'STANDBY'},
  {id:'FL004',name:'FL 004',agency:'MFD',type:'Fire',tab:'assigned',status:'ASSIGNED',address:'440 9th St',crew:'F18 S. Lewis',vehicle:'Truck 4',offBehavior:'STANDBY',cfs:'CFS2507027'},
  {id:'FL008',name:'FL 008',agency:'MFD',type:'Fire',tab:'assigned',status:'ON_SCENE',address:'440 9th St',crew:'F22 N. Green',vehicle:'Engine 8',offBehavior:'STANDBY',cfs:'CFS2507027'},
  {id:'K911',name:'K9 11',agency:'MCSO',type:'K9',tab:'assigned',status:'EN_ROUTE',address:'440 9th St',crew:'K11 P. Stone',vehicle:'K9 11',offBehavior:'AVAILABLE',cfs:'CFS2507027'},
  {id:'S12',name:'S12',agency:'MCSO',type:'Supervisor',tab:'offduty',status:'STANDBY',address:'Offline',crew:'',vehicle:'Unit 12',offBehavior:'STANDBY'}
];
let state={activeTab:'available',expanded:new Set(),groups:{},dragId:null,search:'',mode:'details'};

const els={list:document.querySelector('#units-list'),toast:document.querySelector('#toast'),tabs:document.querySelector('#unit-tabs'),search:document.querySelector('#unit-search'),help:document.querySelector('#drop-help'),details:document.querySelector('#details-view'),map:document.querySelector('#map-view')};

document.querySelector('#call-list').innerHTML=calls.map((c,i)=>`<div class="call-row ${i===0?'active':''}"><i class="call-dot"></i><div class="call-main"><div class="call-id">${c[0]}</div><div class="call-address">${c[1]}</div></div><span class="call-badge">${c[2]}</span></div>`).join('');

function rootId(id){for(const [top,subs] of Object.entries(state.groups)){if(subs.includes(id))return top;}return null}
function getUnit(id){return units.find(u=>u.id===id)}
function filteredRoots(){return units.filter(u=>u.tab===state.activeTab&&!rootId(u.id)&&matches(u))}
function matches(u){const q=state.search.trim().toLowerCase();return !q||[u.name,u.agency,u.type,u.address,u.status].join(' ').toLowerCase().includes(q)}
function statusLabel(s){return ({ACTIVE:'Active',ASSIGNED:'Assigned',EN_ROUTE:'En Route',ON_SCENE:'On Scene',IN_THE_AREA:'In the Area',PROGRESS:'In Progress',STANDBY:'Standby',OFF_DUTY:'Off Duty'})[s]||s}

function unitCard(u,{sub=false,topId=null}={}){
  const expanded=state.expanded.has(u.id); const childCount=(state.groups[u.id]||[]).length;
  const groupBadge=!sub&&childCount?`<span class="group-chip">Grouped · ${childCount+1}</span>`:'';
  const actions=sub?`<button class="action-btn danger-outline" data-action="ungroup-one" data-id="${u.id}">Ungroup</button>`:actionButtons(u);
  return `<article class="unit-card ${sub?'subunit':''} draggable ${expanded?'expanded':''}" draggable="true" data-id="${u.id}">
    <span class="agency-stripe"></span>
    <button class="unit-summary" data-action="toggle" data-id="${u.id}">
      <div class="unit-main"><div class="unit-line"><span class="unit-name">${u.name}<span class="unit-meta"> · ${u.agency} · ${u.type}</span></span>${groupBadge}<span class="status-pill status-${u.status}">${statusLabel(u.status)}</span></div><div class="unit-address">${u.address}</div></div><span class="chev">⌄</span>
    </button>
    <div class="unit-expanded"><dl class="unit-fields">${u.cfs?`<dt>Call</dt><dd>${u.cfs}</dd>`:''}<dt>Shift</dt><dd>Started 38 min ago</dd><dt>Crew</dt><dd>${u.crew||'—'}</dd><dt>Vehicles</dt><dd>${u.vehicle||'—'}</dd></dl><div class="action-row">${actions}</div>${sub?'<div class="subunit-note">Controlled by top unit · actions follow the group</div>':''}</div>
  </article>`
}
function actionButtons(u){
  if(u.tab==='available')return `<button class="action-btn primary" data-action="assign" data-id="${u.id}">Assign</button><button class="action-btn" data-action="status" data-id="${u.id}" data-status="STANDBY">Standby</button>${(state.groups[u.id]||[]).length?`<button class="action-btn danger-outline" data-action="ungroup-all" data-id="${u.id}">Ungroup</button>`:''}`;
  if(u.tab==='assigned')return `<button class="action-btn" data-action="status" data-id="${u.id}" data-status="EN_ROUTE">En Route</button><button class="action-btn" data-action="status" data-id="${u.id}" data-status="ON_SCENE">On Scene</button><button class="action-btn" data-action="status" data-id="${u.id}" data-status="PROGRESS">In Progress</button>${(state.groups[u.id]||[]).length?`<button class="action-btn danger-outline" data-action="ungroup-all" data-id="${u.id}">Ungroup</button>`:''}`;
  return `<button class="action-btn primary" data-action="status" data-id="${u.id}" data-status="ACTIVE">Start shift</button>`;
}
function render(){
  const roots=filteredRoots();
  els.list.innerHTML=roots.map(u=>{const subs=(state.groups[u.id]||[]).map(getUnit).filter(Boolean);return `<div class="unit-group" data-group="${u.id}">${unitCard(u)}${subs.length?`<div class="group-children">${subs.map(s=>unitCard(s,{sub:true,topId:u.id})).join('')}<div class="group-footer"><button class="ungroup-all" data-action="ungroup-all" data-id="${u.id}">Ungroup all</button></div></div>`:''}</div>`}).join('')||`<div class="empty-copy">No units</div>`;
  ['available','assigned','offduty'].forEach(tab=>document.querySelector(`#${tab}-count`).textContent=units.filter(u=>u.tab===tab&&!rootId(u.id)).length);
  wireCards();
}
function wireCards(){
  els.list.querySelectorAll('.unit-card').forEach(card=>{
    card.addEventListener('dragstart',e=>{state.dragId=card.dataset.id;card.classList.add('dragging');els.help.classList.add('visible');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',state.dragId)});
    card.addEventListener('dragend',()=>{state.dragId=null;els.help.classList.remove('visible');document.querySelectorAll('.drop-target,.dragging').forEach(x=>x.classList.remove('drop-target','dragging'))});
    card.addEventListener('dragover',e=>{const target=card.dataset.id;if(!state.dragId||target===state.dragId)return;e.preventDefault();card.classList.add('drop-target')});
    card.addEventListener('dragleave',()=>card.classList.remove('drop-target'));
    card.addEventListener('drop',e=>{e.preventDefault();card.classList.remove('drop-target');const target=card.dataset.id;if(state.dragId&&target!==state.dragId)groupUnits(state.dragId,target)});
  });
}
function groupUnits(draggedId,targetId){
  let top=targetId; const targetParent=rootId(targetId); if(targetParent)top=targetParent;
  if(rootId(draggedId)===top)return;
  ungroupOne(draggedId,false);
  const draggedTopSubs=state.groups[draggedId]||[];
  if(!state.groups[top])state.groups[top]=[];
  state.groups[top].push(draggedId,...draggedTopSubs.filter(x=>x!==top)); delete state.groups[draggedId];
  const topUnit=getUnit(top), dragged=getUnit(draggedId); if(topUnit&&dragged){dragged.tab=topUnit.tab;dragged.status=topUnit.status;dragged.cfs=topUnit.cfs;dragged.address=topUnit.address}
  state.expanded.delete(draggedId); state.expanded.add(top); showToast(`${draggedId} grouped under ${top}. Sub-unit now follows the top unit.`); render();
}
function ungroupOne(id,notify=true){const parent=rootId(id);if(!parent)return;state.groups[parent]=state.groups[parent].filter(x=>x!==id);if(!state.groups[parent].length)delete state.groups[parent];const u=getUnit(id);if(u){if(u.offBehavior==='STANDBY'){u.tab='offduty';u.status='STANDBY';u.address='Offline';delete u.cfs}else{u.tab='available';u.status='ACTIVE';delete u.cfs}}if(notify)showToast(`${id} ungrouped and returned to its original behavior.`);render()}
function ungroupAll(top){const subs=[...(state.groups[top]||[])];subs.forEach(id=>ungroupOne(id,false));delete state.groups[top];showToast(`All units were ungrouped from ${top}.`);render()}
function cascadeStatus(top,status){const root=rootId(top)||top;const ids=[root,...(state.groups[root]||[])];ids.forEach(id=>{const u=getUnit(id);if(!u)return;u.status=status;if(status==='ACTIVE'){u.tab='available';delete u.cfs}else if(['ASSIGNED','EN_ROUTE','ON_SCENE','IN_THE_AREA','PROGRESS'].includes(status)){u.tab='assigned';u.cfs='CFS2507027';u.address='440 9th St'}else if(status==='STANDBY'){u.tab='offduty';delete u.cfs;u.address='Offline'}});showToast(`${root}${ids.length>1?` + ${ids.length-1} sub-unit${ids.length>2?'s':''}`:''} changed to ${statusLabel(status)}.`);render()}
function assignGroup(id){const root=rootId(id)||id;cascadeStatus(root,'ASSIGNED');state.activeTab='assigned';setActiveTabUI();showToast(`${root}${(state.groups[root]||[]).length?` with sub-unit${state.groups[root].length>1?'s':''} ${(state.groups[root]||[]).join(', ')}`:''} assigned to CFS2507027.`)}
function closeCfs(){const assignedRoots=units.filter(u=>u.tab==='assigned'&&!rootId(u.id));assignedRoots.forEach(root=>{const ids=[root.id,...(state.groups[root.id]||[])];ids.forEach(id=>{const u=getUnit(id);u.tab='available';u.status='ACTIVE';u.address='120 Main St';delete u.cfs})});state.activeTab='available';setActiveTabUI();render();showToast('CFS closed. Grouped units moved together to Available.');}
function showToast(msg){els.toast.textContent=msg;els.toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>els.toast.classList.remove('show'),2600)}

els.list.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const {action,id,status}=b.dataset;if(action==='toggle'){state.expanded.has(id)?state.expanded.delete(id):state.expanded.add(id);render()}if(action==='ungroup-one')ungroupOne(id);if(action==='ungroup-all')ungroupAll(id);if(action==='status')cascadeStatus(id,status);if(action==='assign')assignGroup(id)});
els.tabs.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;state.activeTab=b.dataset.tab;setActiveTabUI();render()});
function setActiveTabUI(){els.tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.activeTab));document.querySelector('#subfilter').innerHTML=state.activeTab==='assigned'?'<span>Current status</span><div class="chips"><button class="chip active">All</button><button class="chip">Assigned</button><button class="chip">En Route</button><button class="chip">On Scene</button></div>':'<span>Current status</span><div class="chips"><button class="chip active">All</button><button class="chip">Active</button></div>'}
els.search.addEventListener('input',e=>{state.search=e.target.value;render()});
document.querySelector('#page-mode').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(!b)return;state.mode=b.dataset.mode;document.querySelectorAll('#page-mode button').forEach(x=>x.classList.toggle('active',x===b));els.details.classList.toggle('hidden',state.mode!=='details');els.map.classList.toggle('hidden',state.mode!=='map')});
document.querySelector('.danger-btn').addEventListener('click',()=>{if(confirm('Close CFS2507027? This demonstrates grouped unit close behavior.'))closeCfs()});
render();
