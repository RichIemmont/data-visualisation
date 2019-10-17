// Main page for front
/*data = d3.json("https://raw.githubusercontent.com/d3/d3-hierarchy/v1.1.8/test/data/flare.json", function (data) {
    chart(data);
});*/
const domains = ['ROBOTIQUE', 'VISION PAR ORDINATEUR', 'MACHINE LEARNING', 'DEEP LEARNING', 'SYSTEME DE RECOMMANDATION',
    'TRAITEMENT NATUREL DU LANGAGE', 'ETHIQUE', 'SYSTEME EXPERT', 'AUTRE'];

d3.csv('./data/toulouse.csv').then(function (data) {
    let listOfDomains = [];

    domains.forEach(element => {
        let obj = {name: element, children: []};
        listOfDomains.push(obj);
    });

    data.forEach(row => {
        row.name = row.NOM;
        row.value = row.Num
        domains.forEach(column => {
            if (row[column] !== "") {
                let result = listOfDomains.filter(obj => {
                    return obj.name === column
                });
                result[0].children.push(row);
            }
        });
    });
    let toulouseCompanies = {name: "Toulouse", children: listOfDomains};
    chart(toulouseCompanies);
});

chart = function (data) {
    let pack = data => d3.pack()
        .size([width, height])
        .padding(1)
        (d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value));

    let height = window.innerHeight;
    let width = window.innerWidth;
    let format = d3.format(",d");
    let color = d3.scaleLinear()
        .domain([0, 5])
        .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
        .interpolate(d3.interpolateHcl);

    let circleColor = function (d) {
        if (d.depth === 0) {
            return 'root'
        }

        if (d.depth === 1) {
            let cssId = domains.indexOf(d.data.name);
            return 'children-' + (cssId + 1);
        }

        if (d.depth === 2) {
            let cssId = domains.indexOf(d.parent.data.name);
            return 'baby-' + (cssId + 1);
        }

        let cssId = domains.indexOf(d.parent.parent.data.name);
        return 'mini-' + (cssId + 1);
    };

    const root = pack(data);
    let focus = root;
    let view;

    const svg = d3.select("body").append("svg")
        .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
        .style("display", "block")
        .style("cursor", "pointer")
        .on("click", () => zoom(root));

    const node = svg.append("g")
        .selectAll("circle")
        .data(root.descendants().slice(1))
        .join("circle")
        .attr("fill", d => d.children ? color(d.depth) : "white")
        .attr("class", d => circleColor(d))
        .attr("pointer-events", d => null)
        .attr("stroke-width", "1px")
/*        .on("mouseover", function () {
            d3.select(this).attr("stroke", "#FFF");
        })
        .on("mouseout", function () {
            d3.select(this).attr("stroke", null);
        })*/
        .on("click", d => focus !== d && (zoom(d), d3.event.stopPropagation()));

    const label = svg.append("g")
        .style("font-size", "10px")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .selectAll("text")
        .data(root.descendants())
        .join("text")
        .style("fill-opacity", d => d.parent === root ? 1 : 0)
        .style("display", d => d.parent === root ? "inline" : "none")
        .text(d => d.data.name)
        .style("font-weight", "lighter");

    zoomTo([root.x, root.y, root.r * 2]);

    function zoomTo(v) {
        const k = height / v[2];
        view = v;

        label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("r", d => d.r * k);
    }

    function zoom(d) {
        const focus0 = focus;

        focus = d;

        const transition = svg.transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .tween("zoom", d => {
                const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                return t => zoomTo(i(t));
            });

        label
            .filter(function (d) {
                return d.parent === focus || this.style.display === "inline";
            })
            .transition(transition)
            .style("fill-opacity", d => d.parent === focus ? 1 : 0)
            .on("start", function (d) {
                if (d.parent === focus) this.style.display = "inline";
            })
            .on("end", function (d) {
                if (d.parent !== focus) this.style.display = "none";
            });
    }

    return svg.node();
};
