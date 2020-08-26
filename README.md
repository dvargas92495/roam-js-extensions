# Roam JS Extensions

A suite of JavaScript tools to extend popular workflows in [Roam](https://roamresearch.com). 

## Usage

Each tool is hosted at `https://roam.davidvargas.me/master/[name].js`. To use any given tool, add the following code block under a `{{[[roam/js]]}}` block in your Roam database, replacing `[name]` with the actual name of the script:

```javascript
var old = document.getElementById("[name]");
if (old) { old.remove(); }

var s = document.createElement("script");
    s.src = "https://roam.davidvargas.me/master/[name].js";
    s.id = "[name]";
    s.async = false;
    s.type  = 'text/javascript';
    document.getElementsByTagName('head')[0].appendChild(s);
```

The code block runs on initial load of your roam database. It adds a script tag to the head of your browser, which loads then runs the tool, providing you with the added functionality.

## Extensions

This page lists all of the available extensions, as well as how to set up and use each one. Each extension gets bundled into its own script file, with the entrypoints stored [here](https://github.com/dvargas92495/roam-js-extensions/tree/master/src/entries). You could also see the list of extensions at https://roam.davidvargas.me.

### Google Calendar

The Google Calendar extension allows users to import the list of events on a given day into their daily notes page.

#### Setup
1. Go to https://console.cloud.google.com/apis/credentials and create an API Key
    1. Name it something intuitive, like "Google Calendar Roam Integration"
1. 

## Contributing

See the [Contributing Guide](./CONTRIBUTING.md) for more information!
