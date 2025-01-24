Overview
Identify where in your TypeSpec definitions (e.g., routes.tsp, main.tsp, etc.) you are defining your operations or interfaces.
Gather these definitions using a navigateProgram-style traversal (or TypeSpec’s built-in helpers).
Generate a .go file (e.g., api.go) that includes:
One Go interface for each TypeSpec interface.
Function or method signatures for each TypeSpec operation (e.g., @get, @put, @post, etc.).
Decide if you want to produce only the interfaces (so other code can implement them) or generate a more complete server scaffolding with route wiring.
By doing so, your emitter can produce not just data models but also API-level code that dev teams can implement or integrate with their frameworks.

1. Locate Interface or Operation Definitions
What You’ll Need
navigateProgram or similar methods:
You’ll be looking specifically for Interface or Operation nodes in your TypeSpec AST.
Each interface typically has one or more operations decorated with route info (@get, @put, @post, etc.) or path segments (@route("/myPath")).
Steps
Traverse your TypeSpec Program:
Filter out TypeSpec’s built-in routes or anything from specs/lib/ if you only want custom routes from examples/custom-api/.
Accumulate a list of user-defined Interface definitions representing your route sets.
For Each Interface, gather the Operation children:
Each operation will usually have route info, an HTTP method annotation, parameters, etc.
Store them in a data structure that your code generator can easily handle (e.g., an array of “operation descriptors” per interface).
Rationale
Separating model generation (what you already have) from operation generation (the new piece) keeps things modular.
This step is about discovering “Which operations exist?” so you can later map them to Go code.
2. Generate a .go File with Interfaces and Operations
File Organization
You may decide to create a single file (e.g., api.go) or multiple files (e.g., one file per interface).
Typically, if you have multiple route interfaces (Opportunities, Grants, etc.), you might have a separate interface in Go for each one.
The Go Interface Approach
Create a Go interface for each TypeSpec interface:

The interface name might mirror the TypeSpec interface name (e.g., CustomOpportunities → CustomOpportunitiesAPI).
Alternatively, you can rename or prefix/suffix to follow Go naming conventions.
Add method signatures for each operation:

Each @get or @put becomes a method like ReadOpportunity(...) or UpdateOpportunity(...).
Determine how you want to represent request/response shapes in Go (e.g., using your already-generated models or returning raw data structures).
Consider whether route params become method parameters or part of a context object.
Annotate method signatures with doc comments if you want to carry over docstrings from TypeSpec’s @doc or @summary.

Optionally handle path definitions—some folks embed them in comments or generate route constants (like "/opportunities/{id}") so you have a quick reference.

Consider how you represent error statuses or response codes in Go. If you want a single interface returning (T, error), then each operation might look like func (c *CustomOpportunitiesAPI) ReadOpportunity(ctx context.Context, id string) (CustomOpportunity, error)—depending on your style.

Full Server vs. Just Types
If you only want the “types” (interfaces, operation signatures), stop here.
If you’d like to wire them up to a real HTTP server, you might:
Generate code that references a router (e.g., gorilla/mux, chi, net/http, or gin).
Insert placeholders for request/response parsing (like func (c *CustomOpportunitiesAPI) ReadOpportunity(w http.ResponseWriter, r *http.Request) { ... }).
This can get more complex, so decide if it’s in scope.
3. Decide on Implementation Details
If You Generate Full Server Wiring
Imports:
You’ll likely import "net/http" or a third-party router library.
Possibly import your models from your newly generated models.go.
Routing Setup:
For each interface, you might generate a func (api *CustomOpportunitiesAPI) SetupRoutes(router *mux.Router) or similar.
Inside that function, produce stubs like router.HandleFunc("/opportunities/{id}", api.ReadOpportunity).Methods("GET").
Method Stubs:
Each operation method might look like func (api *CustomOpportunitiesAPI) ReadOpportunity(w http.ResponseWriter, r *http.Request) { /* TODO */ }.
If You Only Want Interfaces (No Implementation)
No router references.
No method bodies.
Just an interface that says ReadOpportunity(ctx context.Context, id string) (CustomOpportunity, error) or something similar.
Either approach is valid—just decide if your final consumer wants complete server scaffolding or only the function signatures to implement by hand.

Conclusion: The Three-Point Summary
Discover your route definitions by enumerating Interface / Operation nodes.
Generate a .go file with a corresponding Go interface (or multiple interfaces).
Optionally add real server scaffolding—enforce method signatures that handle the actual HTTP request/response cycle or keep it to pure signatures for user implementation.
Because you already have model generation (and presumably a mechanism to produce .go files for them), you can use a similar strategy for operations:

Gather nodes → build strings → store them in a Map<string, string> → finalize as an api.go or routes.go file.
This ensures that your TypeSpec definitions (in examples/custom-api/src/routes.tsp) seamlessly map to Go server logic, enabling an end-to-end “TypeSpec → Go API” workflow.