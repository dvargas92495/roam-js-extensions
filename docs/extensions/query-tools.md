## Query Tools

The Query Tools extension adds various tools on top of traditional Roam queries to make them more powerful

### Usage

The script is not configurable.

On expanded queries, there will be a sort icon that appears next to the results text. Clicking on the sort icon will make a sort menu visible to the user with the following options:

- Sort By Page Title - This will sort all the query results in ascending alphabetical order of the page title.
- Sort By Page Title Descending - This will sort all the query results in descending alphabetical order of the page title.
- Sort By Created Date - This will sort all the query results in ascending order that the page was created.
- Sort By Created Date Descending - This will sort all the query results in descending order that the page was created.
- Sort By Edited Date - This will sort all the query results in ascending order that the page was last edited.
- Sort By Edited Date Descending - This will sort all the query results in descending order that the page was last edited.
- Sort By Daily Note - This will sort all the query results in ascending order by Daily Note, followed by created date of non-daily note pages.
- Sort By Daily Note Descending - This will sort all the query results in descending order by Daily Note, followed by created date of non-daily note pages.

To persist a particular sort on a query, create a child block with the `Default Sort` attribute. Valid values include each of the options above, minus the sort by prefix. For example, `Default Sort:: Page Title`.

### Randomization

Sometimes we have queries with hundreds of results and want to return a random element from that query. Returning random results from multiple queries could lead to serendipitous connections. To return a random result from a query, add the`Random` attribute as a child block of the query, with a value of `True`.

### Installation

Insert this as a child of any `[[roam/js]]` block to install the extension.

```javascript
var old = document.getElementById("query-tools");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roam.davidvargas.me/master/query-tools.js";
s.id = "query-tools";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```

### Demo

<video width="320" height="240" controls>
  <source src="../../videos/query-sort.mp4" type="video/mp4">
</video>

<br/>

<iframe src="https://github.com/sponsors/dvargas92495/button" title="Sponsor dvargas92495" height="35" width="116" style="border: 0;"></iframe>
