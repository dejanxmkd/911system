const units=[
  {id:'A52',name:'A52',agency:'MCSO',type:'Patrol',tab:'available',status:'ACTIVE',address:'120 Main St',crew:'523 J. Miller',vehicle:'Unit 52',offBehavior:'AVAILABLE'},
  {id:'B25',name:'B25',agency:'MCSO',type:'Patrol',tab:'available',status:'ACTIVE',address:'85 Church Ave',crew:'411 A. Torres',vehicle:'Unit 25',offBehavior:'AVAILABLE'},
  {id:'1001',name:'1001 – Police Car',agency:'MPD',type:'Patrol',tab:'available',status:'ACTIVE',address:'300 Broadway',crew:'291 D. Carter',vehicle:'Police Car 1001',offBehavior:'AVAILABLE'},
  {id:'1002',name:'1002 – Fire Truck',agency:'MFD',type:'Fire',tab:'available',status:'ACTIVE',address:'Fire Station 1',crew:'F12 R. Evans',vehicle:'Engine 1002',offBehavior:'STANDBY'},
  {id:'FL004',name:'FL 004',agency:'MFD',type:'Fire',tab:'assigned',status:'ASSIGNED',address:'440 9th St',crew:'F18 S. Lewis',vehicle:'Truck 4',offBehavior:'STANDBY',cfs:'CFS2507027'},
  {id:'FL008',name:'FL 008',agency:'MFD',type:'Fire',tab:'assigned',status:'ON_SCENE',address:'440 9th St',crew:'F22 N. Green',vehicle:'Engine 8',offBehavior:'STANDBY',cfs:'CFS2507027'},
  {id:'K911',name:'K9 11',agency:'MCSO',type:'K9',tab:'assigned',status:'EN_ROUTE',address:'440 9th St',crew:'K11 P. Stone',vehicle:'K9 11',offBehavior:'AVAILABLE',cfs:'CFS2507027'}
];

let state={activeTab:'available',expanded:new Set(),groups:{},dragId:null,search:''};
const els={list:document.querySelector('#units-list'),toast:document.querySelector('#toast'),tabs:document.querySelector('#unit-tabs'),search:document.querySelector('#unit-search'),help:document.querySelector('#drop-help'),subfilter:document.querySelector('#subfilter')};

function rootId(id){for(const [top,subs] of Object.entries(state.groups)){if(subs.includes(id))return top;}return null}
function getUnit(id){return units.find(u=>u.id===id)}
function matches(u){const q=state.search.trim().toLowerCase();return !q||[u.name,u.agency,u.type,u.address,u.status].join(' ').toLowerCase().includes(q)}
function statusLabel(s){return ({ACTIVE:'Active',ASSIGNED:'Assigned',EN_ROUTE:'En Route',ON_SCENE:'On Scene',PROGRESS:'In Progress',STANDBY:'Standby'})[s]||s}
function roots(){return units.filter(u=>u.tab===state.activeTab&&!rootId(u.id)&&matches(u))}

function unitCard(u,{sub=false}={}){
  const expanded=state.expanded.has(u.id);
  const childCount=(state.groups[u.id]||[]).length;
  const groupBadge=!sub&&childCount?`<span class="group-chip">Grouped · ${childCount+1}</span>`:'';
  const actions=sub
    ? `<button class="action-btn danger-outline" data-action="ungroup-one" data-id="${u.id}">Ungroup</button>`
    : actionButtons(u);
  return `<article class="unit-card ${sub?'subunit':''} draggable ${expanded?'expanded':''}" draggable="true" data-id="${u.id}">
    <span class="agency-stripe"></span>
    <button class="unit-summary" data-action="toggle" data-id="${u.id}">
      <div class="unit-main">
        <div class="unit-line"><span class="unit-name">${u.name}<span class="unit-meta"> · ${u.agency} · ${u.type}</span></span>${groupBadge}<span class="status-pill status-${u.status}">${statusLabel(u.status)}</span></div>
        <div class="unit-address">${u.address}</div>
      </div>
      <span class="chev">⌄</span>
    </button>
    <div class="unit-expanded">
      <dl class="unit-fields">${u.cfs?`<dt>Call</dt><dd>${u.cfs}</dd>`:''}<dt>Shift</dt><dd>Started 38 min ago</dd><dt>Crew</dt><dd>${u.crew||'—'}</dd><dt>Vehicles</dt><dd>${u.vehicle||'—'}</dd></dl>
      <div class="action-row">${actions}</div>
      ${sub?'<div class="subunit-note">Controlled by top unit</div>':''}
    </div>
  </article>`;
}

function actionButtons(u){
  if(u.tab==='available')return `<button class="action-btn primary" data-action="assign" data-id="${u.id}">Assign</button>${(state.groups[u.id]||[]).length?`<button class="action-btn danger-outline" data-action="ungroup-all" data-id="${u.id}">Ungroup</button>`:''}`;
  return `<button class="action-btn" data-action="status" data-id="${u.id}" data-status="EN_ROUTE">En Route</button><button class="action-btn" data-action="status" data-id="${u.id}" data-status="ON_SCENE">On Scene</button>${(state.groups[u.id]||[]).length?`<button class="action-btn danger-outline" data-action="ungroup-all" data-id="${u.id}">Ungroup</button>`:''}`;
}

function render(){
  els.list.innerHTML=roots().map(u=>{
    const subs=(state.groups[u.id]||[]).map(getUnit).filter(Boolean);
    return `<div class="unit-group">${unitCard(u)}${subs.length?`<div class="group-children">${subs.map(s=>unitCard(s,{sub:true})).join('')}<div class="group-footer"><button class="ungroup-all" data-action="ungroup-all" data-id="${u.id}">Ungroup all</button></div></div>`:''}</div>`;
  }).join('')||'<div class="empty-copy">No units</div>';
  document.querySelector('#available-count').textContent=units.filter(u=>u.tab==='available'&&!rootId(u.id)).length;
  document.querySelector('#assigned-count').textContent=units.filter(u=>u.tab==='assigned'&&!rootId(u.id)).length;
  wireDrag();
}

function wireDrag(){
  els.list.querySelectorAll('.unit-card').forEach(card=>{
    card.addEventListener('dragstart',e=>{state.dragId=card.dataset.id;card.classList.add('dragging');els.help.classList.add('visible');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',state.dragId)});
    card.addEventListener('dragend',()=>{state.dragId=null;els.help.classList.remove('visible');document.querySelectorAll('.drop-target,.dragging').forEach(x=>x.classList.remove('drop-target','dragging'))});
    card.addEventListener('dragover',e=>{if(!state.dragId||card.dataset.id===state.dragId)return;e.preventDefault();card.classList.add('drop-target')});
    card.addEventListener('dragleave',()=>card.classList.remove('drop-target'));
    card.addEventListener('drop',e=>{e.preventDefault();card.classList.remove('drop-target');if(state.dragId&&state.dragId!==card.dataset.id)groupUnits(state.dragId,card.dataset.id)});
  });
}

function groupUnits(draggedId,targetId){
  const targetTop=rootId(targetId)||targetId;
  if(targetTop===draggedId||rootId(draggedId)===targetTop)return;
  detach(draggedId,false);
  const carried=state.groups[draggedId]||[];
  if(!state.groups[targetTop])state.groups[targetTop]=[];
  state.groups[targetTop].push(draggedId,...carried.filter(id=>id!==targetTop));
  delete state.groups[draggedId];
  const top=getUnit(targetTop);
  [draggedId,...carried].forEach(id=>{const u=getUnit(id);if(u&&top){u.tab=top.tab;u.status=top.status;u.cfs=top.cfs;u.address=top.address}});
  state.expanded.add(targetTop);
  showToast(`${draggedId} grouped under ${targetTop}`);
  render();
}

function detach(id,notify=true){
  const parent=rootId(id);if(!parent)return;
  state.groups[parent]=state.groups[parent].filter(x=>x!==id);if(!state.groups[parent].length)delete state.groups[parent];
  const u=getUnit(id);if(u){if(u.offBehavior==='STANDBY'){u.tab='available';u.status='ACTIVE';u.address='Fire Station 1';delete u.cfs}else{u.tab='available';u.status='ACTIVE';delete u.cfs}}
  if(notify)showToast(`${id} ungrouped`);
}

function ungroupAll(top){[...(state.groups[top]||[])].forEach(id=>detach(id,false));delete state.groups[top];showToast(`All units ungrouped from ${top}`);render()}
function cascade(root,status){const top=rootId(root)||root;[top,...(state.groups[top]||[])].forEach(id=>{const u=getUnit(id);if(!u)return;u.status=status;u.tab='assigned';u.cfs='CFS2507027';u.address='440 9th St'});showToast(`Group status changed to ${statusLabel(status)}`);render()}
function assign(id){const top=rootId(id)||id;[top,...(state.groups[top]||[])].forEach(uid=>{const u=getUnit(uid);u.tab='assigned';u.status='ASSIGNED';u.cfs='CFS2507027';u.address='440 9th St'});state.activeTab='assigned';syncTabs();showToast(`${top}${(state.groups[top]||[]).length?' with grouped units':''} assigned to CFS2507027`);render()}
function showToast(msg){els.toast.textContent=msg;els.toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>els.toast.classList.remove('show'),2200)}
function syncTabs(){els.tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.activeTab));els.subfilter.innerHTML=state.activeTab==='assigned'?'<span>Current status</span><div class="chips"><button class="chip active">All</button><button class="chip">Assigned</button><button class="chip">En Route</button><button class="chip">On Scene</button></div>':'<span>Current status</span><div class="chips"><button class="chip active">All</button><button class="chip">Active</button></div>'}

els.list.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const {action,id,status}=b.dataset;if(action==='toggle'){state.expanded.has(id)?state.expanded.delete(id):state.expanded.add(id);render()}else if(action==='ungroup-one'){detach(id);render()}else if(action==='ungroup-all')ungroupAll(id);else if(action==='status')cascade(id,status);else if(action==='assign')assign(id)});
els.tabs.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;state.activeTab=b.dataset.tab;syncTabs();render()});
els.search.addEventListener('input',e=>{state.search=e.target.value;render()});
render();