const initialUnits = [
  {id:'A52',name:'A52',agency:'MCSO',type:'Patrol',tab:'available',status:'ACTIVE',location:'120 Main St',shift:'Started 38 min ago',crew:'523 J. Miller',vehicle:'Unit 52',fallback:'AVAILABLE'},
  {id:'B25',name:'B25',agency:'MCSO',type:'Patrol',tab:'available',status:'ACTIVE',location:'85 Church Ave',shift:'Started 29 min ago',crew:'411 A. Torres',vehicle:'Unit 25',fallback:'AVAILABLE'},
  {id:'1001',name:'1001 – Police Car',agency:'MPD',type:'Patrol',tab:'available',status:'ACTIVE',location:'300 Broadway',shift:'Started 42 min ago',crew:'291 D. Carter',vehicle:'Police Car 1001',fallback:'AVAILABLE'},
  {id:'1002',name:'1002 – Fire Truck',agency:'MFD',type:'Fire',tab:'available',status:'ACTIVE',location:'Fire Station 1',shift:'Started 16 min ago',crew:'F12 R. Evans',vehicle:'Engine 1002',fallback:'STANDBY'},
  {id:'FL004',name:'FL 004',agency:'MFD',type:'Fire',tab:'assigned',status:'ASSIGNED',location:'440 9th St',shift:'Started 1 hr ago',crew:'F18 S. Lewis',vehicle:'Truck 4',fallback:'STANDBY',cfs:'CFS2507027'},
  {id:'FL008',name:'FL 008',agency:'MFD',type:'Fire',tab:'assigned',status:'ON_SCENE',location:'440 9th St',shift:'Started 54 min ago',crew:'F22 N. Green',vehicle:'Engine 8',fallback:'STANDBY',cfs:'CFS2507027'},
  {id:'K911',name:'K9 11',agency:'MCSO',type:'K9',tab:'assigned',status:'EN_ROUTE',location:'440 9th St',shift:'Started 47 min ago',crew:'K11 P. Stone',vehicle:'K9 11',fallback:'AVAILABLE',cfs:'CFS2507027'},
  {id:'S12',name:'S12',agency:'MCSO',type:'Supervisor',tab:'offduty',status:'OFF_DUTY',location:'',shift:'',crew:'',vehicle:'Unit 12',fallback:'AVAILABLE'}
];

const cloneUnits = () => initialUnits.map(u => ({...u}));
let units = cloneUnits();
let state = {tab:'available',context:'details',expanded:new Set(),groups:{},dragId:null,search:'',logs:[]};

const list = document.querySelector('#unit-list');
const tabs = document.querySelector('#unit-tabs');
const search = document.querySelector('#unit-search');
const toast = document.querySelector('#toast');
const logFeed = document.querySelector('#log-feed');
const substatus = document.querySelector('#substatus');
const contextNote = document.querySelector('#context-note');

function unit(id){return units.find(u=>u.id===id)}
function parentOf(id){for(const [top,subs] of Object.entries(state.groups)){if(subs.includes(id)) return top}return null}
function rootOf(id){return parentOf(id)||id}
function groupMembers(root){return [root,...(state.groups[root]||[])]}
function statusLabel(s){return ({ACTIVE:'Active',ASSIGNED:'Assigned',EN_ROUTE:'En Route',ON_SCENE:'On Scene',IN_PROGRESS:'In Progress',STANDBY:'Standby',OFF_DUTY:'Off duty'})[s]||s}
function countRoots(tab){return units.filter(u=>u.tab===tab&&!parentOf(u.id)).length}
function visibleRootUnits(){
  const q=state.search.trim().toLowerCase();
  return units.filter(u=>u.tab===state.tab&&!parentOf(u.id)).filter(u=>!q||[u.name,u.agency,u.type,u.location,u.status].join(' ').toLowerCase().includes(q));
}
function log(message,detail=''){
  state.logs.unshift({message,detail,time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})});
  renderLogs();
}
function showToast(message){toast.textContent=message;toast.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove('show'),2400)}

function actionsFor(u,sub){
  if(sub) return `<button class="action-button danger" data-action="ungroup-one" data-id="${u.id}">Ungroup</button>`;
  const grouped=(state.groups[u.id]||[]).length>0;
  if(u.tab==='available') return `<button class="action-button primary" data-action="assign" data-id="${u.id}">Assign</button><button class="action-button" data-action="status" data-status="STANDBY" data-id="${u.id}">Standby</button>${grouped?`<button class="action-button danger" data-action="ungroup-all" data-id="${u.id}">Ungroup</button>`:''}`;
  if(u.tab==='assigned') return `<button class="action-button" data-action="status" data-status="EN_ROUTE" data-id="${u.id}">En Route</button><button class="action-button" data-action="status" data-status="ON_SCENE" data-id="${u.id}">On Scene</button><button class="action-button" data-action="status" data-status="IN_PROGRESS" data-id="${u.id}">In Progress</button><button class="action-button" data-action="close-cfs" data-id="${u.id}">Close CFS</button>${grouped?`<button class="action-button danger" data-action="ungroup-all" data-id="${u.id}">Ungroup</button>`:''}`;
  return `<button class="action-button primary" data-action="status" data-status="ACTIVE" data-id="${u.id}">Start shift</button>`;
}

function card(u,{sub=false}={}){
  const expanded=state.expanded.has(u.id);
  const groupSize=(state.groups[u.id]||[]).length+1;
  const grouped=!sub&&groupSize>1;
  return `<article class="unit-card ${sub?'subunit':''} ${expanded?'expanded selected':''}" draggable="${u.tab!=='offduty'}" data-id="${u.id}">
    <button class="unit-summary" data-action="toggle" data-id="${u.id}">
      <div class="unit-main">
        <div class="unit-topline">
          <span class="unit-title">${u.name}<span class="unit-meta"> · ${u.agency} · ${u.type}</span></span>
          ${grouped?`<span class="group-badge">Grouped · ${groupSize}</span>`:''}
          <span class="status-badge status-${u.status}">${statusLabel(u.status)}</span>
        </div>
        <div class="unit-location">${u.location||'Offline'}</div>
      </div>
      <span class="chevron">⌄</span>
    </button>
    <div class="unit-expanded">
      <dl class="unit-fields">
        ${u.cfs?`<dt>Call</dt><dd>${u.cfs}</dd>`:''}
        ${u.shift?`<dt>Shift</dt><dd>${u.shift}</dd>`:''}
        ${u.fallback==='STANDBY'?`<dt>Standby</dt><dd>Available when off duty</dd>`:''}
        ${u.crew?`<dt>Crew</dt><dd>${u.crew}</dd>`:''}
        ${u.vehicle?`<dt>Vehicles</dt><dd>${u.vehicle}</dd>`:''}
      </dl>
      <div class="actions-separator"></div>
      <div class="action-area">${actionsFor(u,sub)}${sub?`<div class="subunit-note">Controlled by top unit. All other actions are removed.</div>`:''}</div>
    </div>
  </article>`;
}

function render(){
  document.querySelector('#available-count').textContent=countRoots('available');
  document.querySelector('#assigned-count').textContent=countRoots('assigned');
  document.querySelector('#offduty-count').textContent=countRoots('offduty');
  tabs.querySelectorAll('.unit-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.tab));
  document.querySelectorAll('.context-tab').forEach(b=>b.classList.toggle('active',b.dataset.context===state.context));
  renderSubstatus();
  const roots=visibleRootUnits();
  list.innerHTML=roots.length?roots.map(u=>{
    const subs=(state.groups[u.id]||[]).map(unit).filter(Boolean);
    return `<div class="unit-group">${card(u)}${subs.length?`<div class="subunits">${subs.map(s=>card(s,{sub:true})).join('')}<div class="group-footer"><button data-action="ungroup-all" data-id="${u.id}">Ungroup all</button></div></div>`:''}</div>`;
  }).join(''):`<div class="empty-state">No units</div>`;
  wireDrag();
}

function renderSubstatus(){
  const options=state.tab==='assigned'?['All','Assigned','En Route','On Scene']:state.tab==='available'?['All','Active']:['All','Off duty'];
  substatus.innerHTML=`<span class="substatus-label">Current status</span>${options.map((x,i)=>`<button class="filter-chip ${i===0?'active':''}">${x}</button>`).join('')}`;
  contextNote.textContent=state.context==='map'?'Map view: drag-and-drop grouping uses the same unit cards and behavior.':'CFS details: grouped units can be managed from Available and Assigned.';
  contextNote.classList.add('visible');
}

function renderLogs(){
  logFeed.innerHTML=state.logs.length?state.logs.map(x=>`<div class="log-entry"><span class="log-dot"></span><div><strong>${x.message}</strong><span>${x.detail?x.detail+' · ':''}${x.time}</span></div></div>`).join(''):`<div class="empty-state">No prototype events yet</div>`;
}

function wireDrag(){
  list.querySelectorAll('.unit-card').forEach(el=>{
    if(el.getAttribute('draggable')!=='true') return;
    el.addEventListener('dragstart',e=>{
      const id=el.dataset.id;
      state.dragId=id;
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed='move';
      e.dataTransfer.setData('text/plain',id);
    });
    el.addEventListener('dragend',()=>{
      state.dragId=null;
      document.querySelectorAll('.dragging,.drop-target').forEach(x=>x.classList.remove('dragging','drop-target'));
    });
    el.addEventListener('dragover',e=>{
      if(!state.dragId||state.dragId===el.dataset.id) return;
      e.preventDefault();
      el.classList.add('drop-target');
    });
    el.addEventListener('dragleave',()=>el.classList.remove('drop-target'));
    el.addEventListener('drop',e=>{
      e.preventDefault();
      el.classList.remove('drop-target');
      const dragged=state.dragId||e.dataTransfer.getData('text/plain');
      if(dragged&&dragged!==el.dataset.id) group(dragged,el.dataset.id);
    });
  });
}

function detachWithoutFallback(id){
  const parent=parentOf(id);
  if(parent){
    state.groups[parent]=state.groups[parent].filter(x=>x!==id);
    if(!state.groups[parent].length) delete state.groups[parent];
  }
}

function group(draggedId,targetId){
  let targetRoot=rootOf(targetId);
  if(targetRoot===draggedId||parentOf(targetRoot)===draggedId) return;
  const draggedRoot=rootOf(draggedId);
  if(draggedRoot!==draggedId) detachWithoutFallback(draggedId);
  const nested=[...(state.groups[draggedId]||[])];
  delete state.groups[draggedId];
  state.groups[targetRoot] ||= [];
  const toAdd=[draggedId,...nested].filter(x=>x!==targetRoot&&!state.groups[targetRoot].includes(x));
  state.groups[targetRoot].push(...toAdd);
  const top=unit(targetRoot);
  toAdd.forEach(id=>syncWithTop(unit(id),top));
  state.expanded.add(targetRoot);
  state.expanded.delete(draggedId);
  log(`${top.name} grouped with ${unit(draggedId).name}`,`${unit(draggedId).name} became a sub-unit`);
  showToast(`${unit(draggedId).name} is now controlled by ${top.name}.`);
  render();
}

function syncWithTop(child,top){
  if(!child||!top) return;
  child.tab=top.tab;
  child.status=top.status;
  child.location=top.location;
  child.cfs=top.cfs;
}

function applyStatus(id,status){
  const root=rootOf(id);
  const top=unit(root);
  const members=groupMembers(root);
  members.forEach(mid=>{
    const u=unit(mid);
    u.status=status;
    if(['ASSIGNED','EN_ROUTE','ON_SCENE','IN_PROGRESS'].includes(status)){
      u.tab='assigned';u.cfs='CFS2507027';u.location='440 9th St';
    } else if(status==='ACTIVE'){
      u.tab='available';delete u.cfs;if(!u.location)u.location='Current location';
    } else if(status==='STANDBY'){
      u.tab='offduty';delete u.cfs;u.location='';
    }
  });
  log(`${top.name}${members.length>1?` + ${members.length-1} sub-unit${members.length>2?'s':''}`:''} → ${statusLabel(status)}`,'Status cascaded from top unit');
  showToast(`Status applied to the whole group.`);
  render();
}

function assign(id){
  const root=rootOf(id);
  const top=unit(root);
  const subs=state.groups[root]||[];
  groupMembers(root).forEach(mid=>{const u=unit(mid);u.tab='assigned';u.status='ASSIGNED';u.cfs='CFS2507027';u.location='440 9th St';});
  state.tab='assigned';
  const logText=subs.length?`${top.name} with sub-unit${subs.length>1?'s':''} ${subs.map(x=>unit(x).name).join(', ')} was assigned to CFS2507027`:`${top.name} was assigned to CFS2507027`;
  log(logText,'Assignment');
  showToast('Unit group assigned to CFS2507027.');
  render();
}

function closeCfs(id){
  const root=rootOf(id);
  const top=unit(root);
  groupMembers(root).forEach(mid=>{const u=unit(mid);u.tab='available';u.status='ACTIVE';delete u.cfs;u.location=u.id==='1002'?'Fire Station 1':u.location||'Current location';});
  state.tab='available';
  log(`CFS2507027 closed — ${top.name}${(state.groups[root]||[]).length?' group':''} moved to Available`,'Grouped units stayed together');
  showToast('CFS closed. The whole group moved to Available.');
  render();
}

function fallback(u){
  if(u.fallback==='STANDBY'){
    u.tab='offduty';u.status='STANDBY';u.location='';delete u.cfs;
  }else{
    u.tab='available';u.status='ACTIVE';delete u.cfs;if(!u.location)u.location='Current location';
  }
}

function ungroupOne(id){
  const parent=parentOf(id);
  if(!parent) return;
  state.groups[parent]=state.groups[parent].filter(x=>x!==id);
  if(!state.groups[parent].length) delete state.groups[parent];
  const u=unit(id);fallback(u);
  log(`${u.name} ungrouped`,`Returned to original ${u.fallback==='STANDBY'?'Standby':'Available'} behavior`);
  showToast(`${u.name} ungrouped.`);
  render();
}

function ungroupAll(root){
  const ids=[...(state.groups[root]||[])];
  ids.forEach(id=>fallback(unit(id)));
  delete state.groups[root];
  log(`${unit(root).name} group ungrouped`,`${ids.length} sub-unit${ids.length===1?'':'s'} restored to original behavior`);
  showToast('All sub-units ungrouped.');
  render();
}

list.addEventListener('click',e=>{
  const control=e.target.closest('[data-action]');
  if(!control) return;
  const {action,id,status}=control.dataset;
  if(action==='toggle'){
    state.expanded.has(id)?state.expanded.delete(id):state.expanded.add(id);render();
  }else if(action==='status') applyStatus(id,status);
  else if(action==='assign') assign(id);
  else if(action==='close-cfs') closeCfs(id);
  else if(action==='ungroup-one') ungroupOne(id);
  else if(action==='ungroup-all') ungroupAll(id);
});

tabs.addEventListener('click',e=>{
  const b=e.target.closest('[data-tab]');if(!b)return;state.tab=b.dataset.tab;render();
});
document.querySelector('#context-tabs').addEventListener('click',e=>{
  const b=e.target.closest('[data-context]');if(!b)return;state.context=b.dataset.context;render();
});
search.addEventListener('input',e=>{state.search=e.target.value;render();});
document.querySelector('#reset-demo').addEventListener('click',()=>{
  units=cloneUnits();state={tab:'available',context:'details',expanded:new Set(),groups:{},dragId:null,search:'',logs:[]};search.value='';render();renderLogs();showToast('Prototype reset.');
});

log('Prototype ready','Drag B25 onto A52, or 1002 – Fire Truck onto 1001 – Police Car');
render();
