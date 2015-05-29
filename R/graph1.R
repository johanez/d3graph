require(d3Network)
require(networkD3)

# Load data
data(MisLinks)
data(MisNodes)



nodes <- read.csv("../data/nodes1.csv", header = T)
links <- read.csv("../data/links.csv", header = T)

# Create graph
forceNetwork(Links = links, Nodes = nodes, Source = "source", charge=-100,
             Target = "target", Value = "value", NodeID = "id",
             Group = "group", opacity = 0.8, linkDistance = "function(d){return 10- Math.sqrt(d.value)}")

d3ForceNetwork(Links = links, Nodes = nodes, Source = "source", charge=-100,
             Target = "target", Value = "value", NodeID = "id",
             Group = "group", opacity = 0.8, linkDistance = "function(d){return 10- Math.sqrt(d.value)}")

nodes <- data.frame(id=c(1,2), group=1)
links <- data.frame(source=0, target=1, value=3)


# Load data
data(MisLinks)
data(MisNodes)

# Create graph
forceNetwork(Links = MisLinks, Nodes = MisNodes, Source = "source",
             Target = "target", Value = "value", NodeID = "name",
             Group = "group", opacity = 0.4)
