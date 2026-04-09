# Map docs

In short the two most important things to take note of are the Map.tsx and the MapContext.tsx components.

Map.tsx is the actual map, and MapContext.tsx allows you to interact with the map programmatically. MapContext needs to be a parent of whatever components need to manipulate the map, to be safe just keep it as close to the root as possible. You can use the current state of the page.tsx as an example for pretty much everything.

```  
const { flyTo, setZoom, map } = useMapContext();
``` 
is how you can get the functions to manipulate the map.

If theres anything else thats unclear or I should add hmu.
