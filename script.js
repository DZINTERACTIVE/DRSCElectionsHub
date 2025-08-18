document.addEventListener('DOMContentLoaded', () => {
  const electoralVotes = {
    'AL':9,'AK':3,'AZ':11,'AR':6,'CA':54,'CO':10,'CT':7,'DE':3,'DC':3,'FL':30,'GA':16,'HI':4,'ID':4,'IL':19,
    'IN':11,'IA':6,'KS':6,'KY':8,'LA':8,'ME':4,'MD':10,'MA':11,'MI':15,'MN':10,'MS':6,'MO':10,'MT':4,'NE':5,
    'NV':6,'NH':4,'NJ':14,'NM':5,'NY':28,'NC':16,'ND':3,'OH':17,'OK':7,'OR':8,'PA':19,'RI':4,'SC':9,'SD':3,
    'TN':11,'TX':40,'UT':6,'VT':3,'VA':13,'WA':12,'WV':4,'WI':10,'WY':3
  };

  const electionResults = {};
  const totals = { democrat:0, republican:0, undecided:0 };
  const totalVotes = Object.values(electoralVotes).reduce((a,b)=>a+b,0);

  for(const state in electoralVotes){
    const party = electionResults[state] || 'undecided';
    totals[party] += electoralVotes[state];
  }
  totals.undecided = totalVotes - totals.democrat - totals.republican;

  // Map
  const map = new Datamap({
    element: document.getElementById('map-container'),
    scope:'usa',
    responsive:true,
    fills:{ 'DEMOCRAT':'#2563eb','REPUBLICAN':'#dc2626','UNASSIGNED':'transparent','defaultFill':'transparent' },
    data:{},
    geographyConfig:{
      popupTemplate:(geo,data)=>`<div class="datamaps-hoverover"><strong>${geo.properties.name}</strong></div>`,
      borderColor:'#555',
      highlightFillColor:'#333',
      highlightBorderColor:'#fff',
      highlightBorderWidth:2
    }
  });
  d3.select('#map-container svg rect').remove();

  // Zoom & Center
  const zoom = d3.behavior.zoom()
    .scaleExtent([0.5,8])
    .on('zoom',()=>map.svg.selectAll('g').attr('transform',`translate(${d3.event.translate})scale(${d3.event.scale})`));
  map.svg.call(zoom);

  function centerMap(){
    const container=document.getElementById('map-container');
    const usaGroup=map.svg.select('g.datamaps-subunits');
    if(!usaGroup.empty()){
      const bbox=usaGroup.node().getBBox();
      const scale=Math.min(container.offsetWidth/bbox.width,container.offsetHeight/bbox.height)*0.8;
      const tx=(container.offsetWidth-bbox.width*scale)/2-bbox.x*scale;
      const ty=(container.offsetHeight-bbox.height*scale)/2-bbox.y*scale;
      zoom.translate([tx,ty]).scale(scale);
      map.svg.selectAll('g').attr('transform',`translate(${tx},${ty})scale(${scale})`);
    }
  }
  setTimeout(centerMap,100);
  window.addEventListener('resize',()=>map.resize());

  // Update vote bars dynamically
  const demPercent = totals.democrat/538*100;
  const repPercent = totals.republican/538*100;

  document.getElementById('democrat-votes').textContent = totals.democrat;
  document.getElementById('republican-votes').textContent = totals.republican;
  document.getElementById('undecided-votes').textContent = totals.undecided;

  document.getElementById('democrat-bar').style.width = demPercent + '%';
  document.getElementById('republican-bar').style.width = repPercent + '%';
});
