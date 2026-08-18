const fileInput=document.querySelector('#file-input');
const browseButton=document.querySelector('#browse-button');
const dropZone=document.querySelector('#drop-zone');
const statusBar=document.querySelector('#status-bar');
const statusTitle=document.querySelector('#status-title');
const statusMessage=document.querySelector('#status-message');
const review=document.querySelector('#review');
const emptyState=document.querySelector('#empty-state');
const originalImage=document.querySelector('#original-image');
const resultImage=document.querySelector('#result-image');
const reviewName=document.querySelector('#review-name');
const currentIndexEl=document.querySelector('#current-index');
const totalCountEl=document.querySelector('#total-count');
const pendingCount=document.querySelector('#pending-count');
const approvedCount=document.querySelector('#approved-count');
const rejectedCount=document.querySelector('#rejected-count');
const approveButton=document.querySelector('#approve-button');
const rejectButton=document.querySelector('#reject-button');
const previousButton=document.querySelector('#previous-button');
const nextButton=document.querySelector('#next-button');

let sessionId=null;
let items=[];
let currentIndex=0;

function setStatus(show,title='',message=''){
  statusBar.hidden=!show;
  if(show){statusTitle.textContent=title;statusMessage.textContent=message;}
}

function refreshStats(){
  pendingCount.textContent=items.filter(i=>i.decision==='pending').length;
  approvedCount.textContent=items.filter(i=>i.decision==='approved').length;
  rejectedCount.textContent=items.filter(i=>i.decision==='rejected').length;
}

function renderCurrent(){
  if(!items.length){review.hidden=true;emptyState.hidden=false;refreshStats();return;}
  const item=items[currentIndex];
  emptyState.hidden=true;
  review.hidden=false;
  reviewName.textContent=item.name;
  originalImage.src=item.original;
  resultImage.src=item.result;
  currentIndexEl.textContent=currentIndex+1;
  totalCountEl.textContent=items.length;
  previousButton.disabled=currentIndex===0;
  nextButton.disabled=currentIndex===items.length-1;
  approveButton.textContent=item.decision==='approved'?'✓ Approved':'✓ Good';
  rejectButton.textContent=item.decision==='rejected'?'× Rejected':'× Bad';
  approveButton.disabled=item.decision==='approved';
  rejectButton.disabled=item.decision==='rejected';
  refreshStats();
}

function goNextPending(){
  const next=items.findIndex((item,index)=>index>currentIndex&&item.decision==='pending');
  if(next!==-1){currentIndex=next;renderCurrent();return;}
  const first=items.findIndex(item=>item.decision==='pending');
  if(first!==-1){currentIndex=first;renderCurrent();return;}
  if(currentIndex<items.length-1) currentIndex++;
  renderCurrent();
}

async function decide(decision){
  if(!items.length||!sessionId)return;
  const item=items[currentIndex];
  try{
    const response=await fetch(`/review/${sessionId}/${item.id}/decision`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({decision})
    });
    if(!response.ok){const error=await response.json();throw new Error(error.detail||'Could not save decision.');}
    item.decision=decision;
    refreshStats();
    goNextPending();
  }catch(error){
    setStatus(true,'Could not save review',error.message);
    setTimeout(()=>setStatus(false),3500);
  }
}

async function upload(files){
  if(!files||!files.length)return;
  const formData=new FormData();
  [...files].forEach(file=>formData.append('files',file));
  setStatus(true,'Processing images…',`${files.length} upload${files.length===1?'':'s'} queued. This can take a while for large ZIP folders.`);
  browseButton.disabled=true;
  try{
    const response=await fetch('/review/upload',{method:'POST',body:formData});
    const payload=await response.json();
    if(!response.ok)throw new Error(payload.detail||'Upload failed.');
    sessionId=payload.session_id;
    items=payload.items||[];
    currentIndex=0;
    renderCurrent();
    const skipped=(payload.errors||[]).length;
    setStatus(true,'Ready for review',`${items.length} image${items.length===1?'':'s'} processed${skipped?` · ${skipped} skipped`:''}.`);
    setTimeout(()=>setStatus(false),2800);
  }catch(error){
    setStatus(true,'Processing failed',error.message);
  }finally{
    browseButton.disabled=false;
    fileInput.value='';
  }
}

browseButton.addEventListener('click',()=>fileInput.click());
fileInput.addEventListener('change',event=>upload(event.target.files));
['dragenter','dragover'].forEach(type=>dropZone.addEventListener(type,event=>{event.preventDefault();dropZone.classList.add('dragging');}));
['dragleave','drop'].forEach(type=>dropZone.addEventListener(type,event=>{event.preventDefault();dropZone.classList.remove('dragging');}));
dropZone.addEventListener('drop',event=>upload(event.dataTransfer.files));
approveButton.addEventListener('click',()=>decide('approved'));
rejectButton.addEventListener('click',()=>decide('rejected'));
previousButton.addEventListener('click',()=>{if(currentIndex>0){currentIndex--;renderCurrent();}});
nextButton.addEventListener('click',()=>{if(currentIndex<items.length-1){currentIndex++;renderCurrent();}});
window.addEventListener('keydown',event=>{
  if(review.hidden)return;
  const key=event.key.toLowerCase();
  if(key==='g')decide('approved');
  else if(key==='x')decide('rejected');
  else if(event.key==='ArrowLeft'&&currentIndex>0){currentIndex--;renderCurrent();}
  else if(event.key==='ArrowRight'&&currentIndex<items.length-1){currentIndex++;renderCurrent();}
});

renderCurrent();