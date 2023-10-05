# Polymer Editor Client Documentation

## Introduction
Welcome to the Polymer Generator documentation. This tool was integrated into MAD's design, though it may not fully align with the website's philosophy because my initial programming skills were limited, I've aimed to adhere to design principles. The primary goal is to provide users with a web-based graphical interface to utilize [Polyply](https://github.com/marrink-lab/polyply_1.0). Users can connect, add monomer-representing circles, and send data to the server to run Polyply and generate their polymer's structure. 

Polymer Editor comprises three main components: [GeneratorManager](GeneratorManager.tsx), [GeneratorMenu](GeneratorMenu.tsx), and [GeneratorViewer](GeneratorViewer.tsx). The Manager component serves as the central hub, facilitating communication between the menu, the viewer, and the server through socket.io. It manages various processes, including topology generation, coordinate file creation (in GRO format), and GRO-to-PDB file conversion. If server issues arise, an error socket is sent, providing error details to the client. The Manager component also handles ID management and updates when nodes are added or removed. It handles the uploading of an ITP file, extracts information to add nodes to the viewer, and uploads the list of available residues.

### Generator Viewer
The Generator Viewer employs D3 within an SVG frame to manage monomers. D3 effectively translates graph theory principles into polymer representation, where each monomer becomes a node, and links between monomers translate into links between nodes. This information is available in a JSON file consumed by Polyply as input for polymer creation.

To enhance the visual representation, D3 simulation is implemented. This simulation automatically moves nodes for a balanced depiction. It operates similarly to a molecular simulation, with nodes in the SVG adjusting positions at each time step to achieve equilibrium. Please refer to the [D3 Simulation Documentation](https://d3js.org/d3-force/simulation) for more details.

The simulation object is initialized using the `initSimulation` function in [ViewerFunction.ts](ViewerFunction.ts). This object is crucial as it represents the polymer's content in terms of links and nodes. Different forces are applied to center nodes based on screen size and maintain optimal distances between them for better visualization. The `reloadSimulation` function in [ViewerFunction.ts](ViewerFunction.ts) is used to update the simulation when positions change or new nodes are added, among other events. Additional functions allow adding nodes with events for movement and clicking, as well as removing or creating links.

(add more about the righ click custom menu) 

### Generator Menu
The menu polymer receives data from the server: a list that has been generated when the server first ran. This list originates from Polyply and contains all the available residues/monomers. With this list, you can provide a panel with buttons to select which node to add and specify the quantity. As a user, your first choice is to select the forcefield (Martini2 or Martini3). After that, you can choose to load a file for modification—either from your computer, requiring file uploads, or from the website's history or database.
Additionally, you can upload files (ITP or FF) for custom polymers and all nodes. An "undo" button has been designed to reverse each action. It operates based on a memory of each action performed (check go_back_to_previous_simulation in [GeneratorManager](GeneratorManager.tsx))
