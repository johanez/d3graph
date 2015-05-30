var width=800;
var height=600;
var color = d3.scale.category20();

var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height);

function getRadius(rank){
  return 20 + Math.exp(6 - rank) * 0.2;
}

var force = d3.layout.force()
    .gravity(.05)
    .charge(-100)
    .size([width, height]);

queue()
  .defer(d3.csv, "data/nodes1.csv", function(d){
    return {
      index: +d.index,
      id: d.id, // convert "Year" column to Date
      text: d.name,
      group: d.group,
      rank: +d.rank // convert "Length" column to number
    };
  })
  .defer(d3.csv, "data/links.csv", function(d){
    return {
      source: d.source, // convert "Year" column to Date
      target: d.target,
      value: +d.value
    };
  })
//  .defer(d3.csv, "links.csv")
  .await(ready);
//Main function

function ready(error, nodesJson, linksJson) {

    var nodeMap = {};
    nodesJson.forEach(function(x) {
      console.log(x); 
      nodeMap[x.id] = x; 
    });
    console.log(nodeMap);
    linksJson = linksJson.map(function(x) {
      return {
        source: nodeMap[x.source],
        target: nodeMap[x.target],
        value: x.value
      };
    });

  // var edges = [];
  // console.log(edges);
  // linksJson.forEach(function(e) { 
  //   var sourceNode = nodesJson.filter(function(n) { return n.id === e.source; })[0],
  //       targetNode = nodesJson.filter(function(n) { return n.id === e.target; })[0];
  //   //console.log(targetNode);
  //   edges.push({source: sourceNode, target: targetNode, value: e.value});
  // });
   console.log(linksJson);
  // console.log(nodesJson);

  // add nodes to force
  force
    .nodes((nodesJson))
    .links((linksJson));

  var node = svg.selectAll(".node")
    .data(force.nodes())
    .enter().append("g")
    .attr("class", "node")
    .style("fill", function(d) {
      return color(d.group); 
    })
    .style("opacity", 0.4)
    //.on("mouseover", mouseover)
    //.on("mouseout", mouseout)
    .call(force.drag);


  node.append("circle")
    .attr("r", function(d) { 
      return getRadius(d.rank);
    });

  node.append("svg:text")
    .attr("class", "nodetext")
    .attr("text-anchor", "middle")
    .attr("dx", 0)
    .attr("dy", ".35em")
    .style("font-size", function(d) { return 24 - (d.rank*2) + "px"})
    .style("fillh", "#fff")
    .text(function(d) { return d.text });

  var link = svg.selectAll(".link")
    .data(force.links())
    .enter().append("line")
    .attr("class", "link")
    .style("stroke-width", function(d) { return Math.sqrt(d.value); });


  function tick() {
    link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });
    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  }

  var padding = 1; // separation between circles
  function collide(alpha) {
    var quadtree = d3.geom.quadtree(force.nodes);
    return function(d) {
      var radius = getRadius(d.rank);
      var rb = 2*radius + padding,
          nx1 = d.x - rb,
          nx2 = d.x + rb,
          ny1 = d.y - rb,
          ny2 = d.y + rb;
      quadtree.visit(function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== d)) {
          var x = d.x - quad.point.x,
              y = d.y - quad.point.y,
              l = Math.sqrt(x * x + y * y);
            if (l < rb) {
            l = (l - rb) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    };
  }

  force
    .linkDistance(function(d){
      console.log((d.source.rank));
      console.log(getRadius(d.source.rank));
      return (getRadius(d.source.rank) +
              getRadius(d.target.rank) +
              (d.value-1) * 10)
    })
    .on("tick", tick)
    .start();
 
}


function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}



/*d3.json("example.json", function(error, json) {
  var edges = [];
    json.Links.forEach(function(e) { 
    var sourceNode = json.Nodes.filter(function(n) { return n.Id === e.Source; })[0],
    targetNode = json.Nodes.filter(function(n) { return n.Id === e.Target; })[0];
    	
    edges.push({source: sourceNode, target: targetNode, value: e.Value});
    });
    
  force
      .nodes(json.Nodes)
      .links(edges)
      .start();

  var link = svg.selectAll(".link")
      .data(edges)
    .enter().append("line")
      .attr("class", "link");

  var node = svg.selectAll(".node")
      .data(json.Nodes)
    .enter().append("g")
      .attr("class", "node")
      .call(force.drag);

  node.append("circle")
      .attr("class", "node")
      .attr("r", 5);

  node.append("svg:a")
      .attr("xlink:href", function(d){return d.Url;})
      .append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(function(d) { return d.Name})

  
  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  });
});*/

/* from R:
var color = d3.scale.category20();

var force = d3.layout.force()
.nodes(d3.values(nodes))
.links(links)
.size([width, height])
.linkDistance(function(d){return 10- Math.sqrt(d.value)})
.charge(-100)
.on("tick", tick)
.start();

var link = svg.selectAll(".link")
.data(force.links())
.enter().append("line")
.attr("class", "link")
.style("stroke-width", function(d) { return Math.sqrt(d.value); });

var node = svg.selectAll(".node")
.data(force.nodes())
.enter().append("g")
.attr("class", "node")
.style("fill", function(d) { return color(d.group); })
.style("opacity", 0.4)
.on("mouseover", mouseover)
.on("mouseout", mouseout)
.call(force.drag);

node.append("circle")
.attr("r", 6)

node.append("svg:text")
.attr("class", "nodetext")
.attr("dx", 12)
.attr("dy", ".35em")
.text(function(d) { return d.name });

function tick() {
link
.attr("x1", function(d) { return d.source.x; })
.attr("y1", function(d) { return d.source.y; })
.attr("x2", function(d) { return d.target.x; })
.attr("y2", function(d) { return d.target.y; });

node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
}

function mouseover() {
d3.select(this).select("circle").transition()
.duration(750)
.attr("r", 16);
d3.select(this).select("text").transition()
.duration(750)
.attr("x", 13)
.style("stroke-width", ".5px")
.style("font", "17.5px serif")
.style("opacity", 1);
}

function mouseout() {
d3.select(this).select("circle").transition()
.duration(750)
.attr("r", 8);
}
*/