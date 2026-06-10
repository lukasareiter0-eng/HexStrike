// inventory.js — basic inventory system with drag & drop and local save
class Inventory{
  constructor(){
    this.size = 20; // number of slots
    this.slots = new Array(this.size).fill(null);
    this.uiRoot = this._createUI();
    this._bindDragDrop();
    this.load();
  }

  _createUI(){
    const root = document.createElement('div'); root.id = 'inventoryUI';
    root.style.position = 'absolute'; root.style.right = '12px'; root.style.top = '12px'; root.style.pointerEvents = 'auto';
    root.style.background = 'rgba(0,0,0,0.45)'; root.style.padding = '8px'; root.style.borderRadius = '6px'; root.style.display = 'grid';
    root.style.gridTemplateColumns = 'repeat(5,48px)'; root.style.gridGap = '6px';
    document.body.appendChild(root);
    for(let i=0;i<this.size;i++){
      const s = document.createElement('div'); s.className='inv-slot'; s.dataset.index = i; s.style.width='48px'; s.style.height='48px'; s.style.background='rgba(255,255,255,0.03)'; s.style.border='1px solid rgba(255,255,255,0.06)'; s.style.display='flex'; s.style.alignItems='center'; s.style.justifyContent='center'; s.style.color='#fff'; s.style.fontSize='12px';
      root.appendChild(s);
    }
    return root;
  }

  _bindDragDrop(){
    let dragged = null;
    document.addEventListener('pointerdown', (e)=>{
      const slot = e.target.closest('.inv-slot'); if(!slot) return; const idx = Number(slot.dataset.index); if(this.slots[idx]){ dragged = {idx, item:this.slots[idx]}; slot.style.opacity = '0.5'; }
    });
    document.addEventListener('pointerup', (e)=>{
      if(!dragged) return; const slot = e.target.closest('.inv-slot'); if(!slot){ dragged = null; document.querySelectorAll('.inv-slot').forEach(s=>s.style.opacity='1'); return; }
      const to = Number(slot.dataset.index); // swap
      const tmp = this.slots[to]; this.slots[to] = dragged.item; this.slots[dragged.idx] = tmp; this.render(); this.save();
      dragged = null; document.querySelectorAll('.inv-slot').forEach(s=>s.style.opacity='1');
    });
  }

  addItem(item){
    const empty = this.slots.indexOf(null);
    if(empty >= 0){ this.slots[empty] = item; this.render(); this.save(); return true; }
    return false;
  }

  removeItemAt(index){ this.slots[index] = null; this.render(); this.save(); }

  render(){
    const slots = this.uiRoot.querySelectorAll('.inv-slot');
    slots.forEach((el, i)=>{ const it = this.slots[i]; el.textContent = it ? (it.name || it.type || 'item') : ''; });
  }

  save(){ localStorage.setItem('bw_inventory', JSON.stringify(this.slots)); }
  load(){ try{ const s = JSON.parse(localStorage.getItem('bw_inventory')||'[]'); for(let i=0;i<this.size;i++) this.slots[i]=s[i]||null; this.render(); }catch(e){ console.warn('inv load err',e); } }
}

export { Inventory };
