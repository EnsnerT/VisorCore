# Overview  
The `Contextable` library provides a flexible framework for managing and testing context states, enabling dynamic behavior based on conditions. It allows contexts to be registered, tested, and combined using logical operators (`&&`, `||`, `!`) or comparisons (`==`, `!=`, `===`, `!==`). Contexts can be triggered by user interactions (e.g., focus events) or programmatic changes, making it ideal for UI state management, conditional rendering, and event-driven logic.  

# Common Usecases  
- Tracking UI states (e.g., "isXFocused" when an input field is focused).  
- Conditional rendering or behavior based on context evaluations (e.g., `Contextable.parseExpression('!isXFocused').evaluate()`).  
- Managing complex logic with AND/OR/NOT operators and comparisons.  
- Integrating with event listeners to update contexts dynamically (e.g., via `StateChangeListeners`).  

# Key Features  
- **Context Registration**: Register contexts globally using `Contextable.registerContext(id, decider)`.  
- **Expression Parsing**: Parse logical or comparison expressions into evaluatable structures with `Contextable.parseExpression()`.  
- **Decision Classes**:  
  - `LatchedDecision`: Tracks a boolean state (on/off).  
  - `CachedDecision`: Caches results of child decisions for performance.  
  - `StateChangeListeners`: Reacts to context state changes with callbacks.  
- **Logical Operators**: Support for `&&`, `||`, `!` in expressions.  
- **Comparison Operators**: Support for `==`, `!=`, `===`, `!==` in expressions.  

---
# Usage Example  

```typescript  
// 1. Create a LatchedDecision to track focus state  
const isXFocused = new Contextable.LatchedDecision(false);  

// 2. Update the decision on input events  
inputX.addEventListener('focus', () => isXFocused.on());  
inputX.addEventListener('blur', () => isXFocused.off());  

// 3. Register the context globally  
Contextable.registerContext('isXFocused', isXFocused);  

// 4. Test the context directly  
if (Contextable.test('isXFocused')) {  
  console.log('Input X is focused');  
}  

// 5. Parse and evaluate a logical expression  
const expr = Contextable.parseExpression('!isXFocused && alpha');  
console.log(expr.evaluate()); // true if "isXFocused" is false and "alpha" is true  
```  

---

# Advantages of Using Contextable  

1. **Modularity**:  
   - Separates context logic from UI components via `ContextDecider`/`ContextTester` interfaces.  
   - Allows reuse of contexts across different parts of an application.  

2. **Flexibility**:  
   - Supports complex logical expressions with AND/OR/NOT operators.  
   - Enables comparisons between context values and literals.  

3. **Performance**:  
   - `CachedDecision` optimizes repeated evaluations by caching results.  
   - Efficient parsing of expressions into evaluatable structures.  

4. **Extensibility**:  
   - Custom decision classes can be implemented to extend functionality.  
   - Integration with event systems via `StateChangeListeners`.  

---

# API Reference  

## Methods
### Contextable.registerContext  
- **Description**: Registers a context with a unique ID and a decision/tester function.  
- **Definition**: `registerContext(id: string, decider: ContextDecider | ContextTester)`
### Contextable.test  
- **Description**: Evaluates the registered context with optional arguments.  
- **Definition**: `test(id: string, args?: string): boolean | string | number`
### Contextable.parseExpression  
- **Description**: Parses a logical/comparison expression into a `ContextExpression` object for evaluation.  
- **Definition**: `parseExpression(expression: string): ContextExpression`
## Types & Classes
### Contextable.StateChangeListeners\<T>
- **Description**: A class to listen for changes in a context value and trigger callbacks.  
- **Example**:
```typescript  
const listener = new Contextable.StateChangeListeners<boolean>(false);  
listener.listen((value) => {  
  console.log('New value:', value);  
});  
listener.change(true); // Triggers the listener  
```  
### ContextExpression  
- **Description**: Represents a parsed expression with a type (`and`, `or`, `not`, `comparison`, `literal`) and child nodes. 
- **Methods**: 
	- `evaluate(): boolean`: Evaluates the expression based on current context states.  
# Cross Integrations  
The `Contextable` Library *requires no Libraries*.

And *optional* Supports the Libraries: 
- Integrates with event systems (e.g., focus/blur events) via `StateChangeListeners`.  
# Todos  
🔴 To be Verified: Add examples for nested expressions and advanced use cases.  
🔴 To be Verified: Document error handling for invalid expressions.  

---
