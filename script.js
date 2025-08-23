// Add state abbreviations + EVs inside the state
map.svg.selectAll('.datamaps-subunit').each(function(d){
  const stateGroup = d3.select(this.parentNode); // the <g> element containing the state path
  const centroid = map.path.centroid(d);
  const state = d.id;
  const ev = electoralVotes[state];

  // State initials
  stateGroup.append('text')
    .attr('x', centroid[0])
    .attr('y', centroid[1] - 2)
    .attr('text-anchor','middle')
    .attr('font-size','12px')
    .attr('fill','#fff')
    .attr('pointer-events','none')
    .attr('class','state-label')
    .text(state);

  // EV number
  stateGroup.append('text')
    .attr('x', centroid[0])
    .attr('y', centroid[1] + 10)
    .attr('text-anchor','middle')
    .attr('font-size','10px')
    .attr('fill','#ff0')
    .attr('pointer-events','none')
    .attr('class','state-ev')
    .text(ev);
});
