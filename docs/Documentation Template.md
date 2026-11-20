> This Document is a Documentation Template.
> How to read this File:
> - All **instructions** are written in these 'cite' boxes (the lines starting with `> ` )
> - Write the Documentation based on the Format of this Template, limited to Header, CodeBlocks, Font Decorations (bold / italic).
> - When writing the Documentation, **do not include these instuctions**.
> - `{}` are placeholders for you to fill out.
# Overview
The `{libraryName}` library provides {}.
> Start with "The `{libraryName}` library provides" and write 3-8 sentences about the Library and what it does.
# Common Usecases
- Render a UI based on a JSON Structure with ... 
> List here 3 Possible usecases with the Library. Try to not use Code.
# Key Features
- **Feature**: Description
> Write here 3-5 Bulletpoints for "Key Features" this Library has. Use the above Format : Bold Feature Name with a @@  

> Note: The horizontal Line here is ONLY required before the "Usage Example" Title, to seperate the Library Introduction and the Code sections.
---
# Usage Example
```typescript
...
```
> Write a Simple Code Example of the Library usage. Make simple to follow Steps. Format the whole Example wrapped in one Markdown Codeblock of Languague "jsx" or "javascript". Each Step is delimited with 2 new lines before starting with a section number and a Description what is done in the Step.

# Advantages of Using {library}
1. **Modularity**:
	- Seperates logic from {} and {} to be used as a independent Library.
> Write a List of 3-5 Bulletpoints on the Advantages of using this Library. Format: ordered list with numbers, each Item is just 1-3 Words, bold and ends with `:`. The Item has subitems, detailing the Advantage. E.g.: 1. **Modularity**: \n\t- Seperates logic from {} and {} to be used as a independent Library.\n\t- Allows switching between {e.g: KeyBindings}.

# API Reference
## Methods
### Library.sample
- **Description**: This example shows the format of a Static method which does nothing.
- **Definition**: `sample(id: string): void`

## Types & Classes
### Library.SampleClass
- **Description**: This example shows the format of a Class which does not exist.
- **Methods**:
	- `doSomething(id: string): boolean`: Does something 
- **Example**: 
```typescript
// this is an example
// only add example code to Classes and Methods, if the Context is simpler to understand for Developers  
```

> Using the 2 Categories: "Methods" (static Methods) and "Types & Classes" (Important Types & Classes), List some as a L3 Header in the Format: E.g.`Library.method(x,y,z)` -> `### Library.method` then List: "- **Description**: {What does the Method / Class do?}", "- **Definition**: `method(x:type,y:type,z:type):type`" and for Classes: `Library.Clazz` -> `### Clazz` then List: "- **Description**: {What does the class represent or is used for?}", "- **Methods**: " listing of important Class Instance or Class Static Methods in format: "`method():type`: {Description}"

# Cross Integrations
The `{libraryName}` Library *requires* following Libraries:
- [MenuBuilder](docs/MenuBuilder.md) - Building the Settings Menu UI based on Configuration Data.
> Write here the Requirement List, based on the `/readme.md` in Libraries. If there is no Dependency, change the text "Library *requires* following Libraries:" to "Library *requires no Library*.". The Dependencies are rendered as a Unordered List , starting with the Library Name as a Link to the `docs/{libraryName}.md` then a dash `-` and the Reason for this Library Requirement.

And *optional* Supports the Libraries: 
- [Groupable](docs/Groupable.md) - Grouping Settings
- [KeyBinder](docs/KeyBinder.md) - Keyboard interactions and Custom Keybindings.
- [Contextable](docs/Contextable.md) - Mouse and Keyboard interactions support Contexts.
> List here the optional Libraries, if there are any. Use the same **Format** as in the above "Required Libraries". If there are no *optional* Libraries, leave the Part out.
