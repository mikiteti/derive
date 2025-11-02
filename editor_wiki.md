# Editor Module API Documentation

This document provides a comprehensive overview of all exported functions from the editor modules in the `editor/**/*.js` files.

## Table of Contents

- [Main Editor Module](#main-editor-module)
- [Assets Module](#assets-module)
- [Document Module](#document-module)
- [Document Changes Module](#document-changes-module)
- [Document Classes Module](#document-classes-module)
- [Input Module](#input-module)
- [Keyboard Modules](#keyboard-modules)
- [Render Module](#render-module)
- [Caret Module](#caret-module)
- [Selection Module](#selection-module)

---

## Main Editor Module

**File:** `editor/main.js`

### `newEditor(options)`
Creates a new editor instance with document, render, and input components.

**Parameters:**
- `options` (Object, optional): Configuration object
  - `file` (Object, optional): File object containing lines data
  - `textarea` (HTMLElement, optional): DOM element for the editor (defaults to `document.getElementById("editor")`)

**Returns:** `Editor` - Editor instance with `doc`, `render`, and `input` properties

**Example:**
```javascript
const editor = newEditor({ 
  file: { lines: [{ text: "Hello World", tabs: { full: 0 } }] },
  textarea: document.getElementById("my-editor")
});
```

---

## Assets Module

**File:** `editor/assets.js`

### `nodeSizes`
Configuration object defining size constraints for tree nodes.

**Type:** `Object`
- `leaf`: Object with `min`, `initial`, `max` properties (all numbers)
- `node`: Object with `min`, `initial`, `max` properties (all numbers)

### `checkTreeStructure(doc)`
Validates the tree structure of a document and logs errors for nodes that are too small or too large.

**Parameters:**
- `doc` (Doc): Document instance to validate

**Returns:** `undefined`

**Side Effects:** Logs errors to console for invalid nodes, logs success message if no errors found

### `showTreeStructure(doc)`
Displays the tree structure of a document in a hierarchical format in the console.

**Parameters:**
- `doc` (Doc): Document instance to display

**Returns:** `undefined`

**Side Effects:** Logs tree structure to console

---

## Document Module

**File:** `editor/doc/main.js`

### `newDoc(options)`
Creates a new document instance with a hierarchical tree structure of lines.

**Parameters:**
- `options` (Object, optional): Configuration object
  - `editor` (Editor): Editor instance
  - `file` (Object): File object containing lines data
    - `lines` (Array): Array of line objects with `text` and `tabs` properties

**Returns:** `Doc` - Document instance with hierarchical structure

**Example:**
```javascript
const doc = newDoc({ 
  editor: editorInstance,
  file: { 
    lines: [
      { text: "Line 1", tabs: { full: 0 } },
      { text: "Line 2", tabs: { full: 1 } }
    ]
  }
});
```

---

## Document Changes Module

**File:** `editor/doc/changes.js`

### `newChange(options)`
Creates a new Change instance for handling document modifications.

**Parameters:**
- `options` (Object, optional): Configuration object
  - `editor` (Editor): Editor instance

**Returns:** `Change` - Change instance with methods for document modification

### Change Class Methods

#### `delete(from, to)`
Deletes text from the document between specified positions.

**Parameters:**
- `from` (Number, optional): Start position (defaults to `caret.position - 1`)
- `to` (Number, optional): End position (defaults to `from + 1`)

**Returns:** `Array<Line>` - Array of affected lines

#### `insert(string, at)`
Inserts text into the document at the specified position.

**Parameters:**
- `string` (String): Text to insert
- `at` (Number, optional): Insertion position (defaults to `caret.position`)

**Returns:** `Array<Line>` - Array of affected lines

#### `replace(text, from, to)`
Replaces text in the document between specified positions.

**Parameters:**
- `text` (String): Replacement text
- `from` (Number, optional): Start position (defaults to `caret.position`)
- `to` (Number, optional): End position (defaults to `from`)

**Returns:** `Array<Line>` - Array of affected lines

---

## Document Classes Module

**File:** `editor/doc/classes.js`

### Exported Classes

#### `Node`
Base class for tree nodes in the document structure.

**Constructor Parameters:**
- `options` (Object, optional): Configuration object
  - `editor` (Editor): Editor instance
  - `parent` (Node, optional): Parent node
  - `children` (Array, optional): Array of child nodes (defaults to `[]`)

**Properties:**
- `chars` (Number): Total character count in subtree
- `lines` (Number): Total line count in subtree
- `words` (Number): Total word count in subtree
- `text` (String): Concatenated text of all children
- `isTooSmall` (Boolean): Whether node has too few children
- `isTooLarge` (Boolean): Whether node has too many children
- `previousSibling` (Node): Previous sibling node
- `nextSibling` (Node): Next sibling node

**Methods:**
- `update()`: Increments update counter and propagates to parent
- `delete()`: Marks node as deleted and removes from parent
- `assignParent(parent)`: Sets the parent node
- `addChild(child, index)`: Adds a child node at specified index
- `prependChild(child)`: Adds a child node at the beginning

#### `Leaf`
Extends Node class for leaf nodes in the tree structure.

**Constructor:** Same as Node

#### `Doc`
Extends Node class for the root document node.

**Constructor:** Same as Node

**Additional Properties:**
- `change` (Change): Change instance for document modifications

**Methods:**
- `line(lineNum)`: Returns the line at specified line number
- `lineAt(index)`: Returns the line containing the character at specified index
- `linesBetween(line1, line2)`: Returns lines between two line numbers (exclusive)

#### `Line`
Represents a single line of text in the document.

**Constructor Parameters:**
- `options` (Object): Configuration object
  - `editor` (Editor): Editor instance
  - `text` (String): Line text content
  - `parent` (Node): Parent node
  - `tabs` (Object, optional): Tab configuration
  - `decos` (Array, optional): Array of decorations

**Properties:**
- `chars` (Number): Character count including newline
- `words` (Number): Word count
- `number` (Number): Line number in document
- `from` (Number): Starting character index
- `to` (Number): Ending character index
- `previousSibling` (Line): Previous line
- `nextSibling` (Line): Next line

**Methods:**
- `update(text)`: Updates line text and marks for re-rendering
- `delete()`: Marks line as deleted and removes from parent
- `addPosition(position)`: Adds a position marker to this line
- `removePosition(position)`: Removes a position marker from this line
- `assignElement(element)`: Associates DOM element with this line
- `enableDeco(deco)`: Enables a decoration
- `disableDeco(deco)`: Disables a decoration
- `toggleDeco(deco)`: Toggles a decoration
- `setTabs(type, number)`: Sets tab configuration

#### `Position`
Represents a cursor position in the document.

**Constructor Parameters:**
- `pos` (Number|Array): Position as character index or [line, column] array
- `doc` (Doc, optional): Document instance (defaults to `window.doc`)
- `stickWhenDeleted` (Boolean, optional): Whether to stick when deleted (defaults to `true`)

**Properties:**
- `index` (Number): Absolute character index
- `line` (Number): Line number
- `column` (Number): Column number

**Methods:**
- `assign(pos)`: Assigns new position
- `reassign(pos)`: Reassigns position and updates line tracking
- `delete()`: Removes position from line tracking

---

## Input Module

**File:** `editor/input/main.js`

### `newInput(options)`
Creates a new Input instance for handling user input.

**Parameters:**
- `options` (Object, optional): Configuration object
  - `editor` (Editor): Editor instance
  - `textarea` (HTMLElement): DOM element for input handling

**Returns:** `Input` - Input instance with keyboard and caret access

**Properties:**
- `caret` (Caret): Caret instance for cursor management

---

## Keyboard Modules

### Regular Keyboard Module

**File:** `editor/input/keyboard/regular.js`

#### `createCommandSet(editor)`
Creates a command set for regular keyboard input handling.

**Parameters:**
- `editor` (Editor): Editor instance

**Returns:** `Function` - Command function that takes keyboard event and returns command function

**Supported Commands:**
- Arrow keys (Left, Right, Up, Down)
- Backspace and Alt+Backspace
- Meta+Arrow keys (Home, End)
- Alt+Arrow keys (Word navigation)
- Enter (new line)
- Meta+C (copy line)
- Meta+V (paste)
- Tab/Shift+Tab (indentation)
- Meta+D (toggle display math)
- Meta+N (jump to next tab stop)
- All printable characters

### Hotkeys Module

**File:** `editor/input/keyboard/hotkeys.js`

#### `createCommandSet(editor)`
Creates a command set for hotkey handling.

**Parameters:**
- `editor` (Editor): Editor instance

**Returns:** `Function` - Command function that takes keyboard event and returns command function

### Keyboard Main Module

**File:** `editor/input/keyboard/main.js`

#### `newKeyboard(options)`
Creates a new Keyboard instance for managing multiple command sets.

**Parameters:**
- `options` (Object, optional): Configuration object
  - `editor` (Editor): Editor instance
  - `layout` (String, optional): Keyboard layout (defaults to "regular")

**Returns:** `Keyboard` - Keyboard instance

**Methods:**
- `command(e)`: Processes keyboard event through all command sets

---

## Render Module

**File:** `editor/render/main.js`

### `newRender(options)`
Creates a new Render instance for handling document rendering.

**Parameters:**
- `options` (Object, optional): Configuration object
  - `editor` (Editor): Editor instance
  - `textarea` (HTMLElement, optional): DOM element for rendering (defaults to `document.getElementById("editor")`)

**Returns:** `Render` - Render instance

**Properties:**
- `caret` (Caret): Caret instance for cursor rendering

**Methods:**
- `renderInfo()`: Updates document statistics display
- `createLineElement(line)`: Creates DOM element for a line
- `renderAll()`: Renders entire document
- `renderLine(line)`: Renders a specific line

---

## Caret Module

**File:** `editor/render/caret.js`

### `Caret` (Default Export)
Class for managing cursor position and rendering.

**Constructor Parameters:**
- `editor` (Editor): Editor instance
- `textarea` (HTMLElement, optional): DOM element (defaults to `editor.render.textarea`)
- `doc` (Doc, optional): Document instance (defaults to `editor.doc`)
- `style` (String, optional): Caret style (defaults to "bar")

**Properties:**
- `position` (Number): Current cursor position
- `screenPosition` (Object): Screen coordinates and dimensions
- `tabStops` (Array): Array of tab stop positions

**Methods:**
- `placeAt(index, updateScreenX, removeTabStops)`: Places caret at character index
- `placeAtCoordinates(lineElement, x, y, updateScreenX, alternativeLineElement)`: Places caret at screen coordinates
- `addTabStop(pos, index)`: Adds a tab stop position
- `jumpToNextTabStop()`: Moves caret to next tab stop
- `removeTabStops()`: Clears all tab stops

---

## Selection Module

**File:** `editor/render/selection.js`

### `Selection` (Default Export)
Class for managing text selection (currently minimal implementation).

**Constructor Parameters:**
- `editor` (Editor): Editor instance
- `textarea` (HTMLElement, optional): DOM element (defaults to `editor.render.textarea`)
- `doc` (Doc, optional): Document instance (defaults to `editor.doc`)

**Methods:**
- `setRange(from, to)`: Sets selection range (implementation incomplete)

---

## Usage Examples

### Creating a Basic Editor
```javascript
import newEditor from './editor/main.js';

const editor = newEditor({
  file: {
    lines: [
      { text: "Hello, World!", tabs: { full: 0 } },
      { text: "This is line 2", tabs: { full: 1 } }
    ]
  },
  textarea: document.getElementById('editor')
});

// Access document operations
editor.doc.change.insert("New text", 0);

// Access rendering
editor.render.renderAll();

// Access input handling
console.log(editor.input.caret.position);
```

### Working with Document Changes
```javascript
// Insert text at current caret position
const changedLines = editor.doc.change.insert("Hello");

// Delete text from position 5 to 10
const deletedLines = editor.doc.change.delete(5, 10);

// Replace text
const replacedLines = editor.doc.change.replace("New text", 0, 5);

// Re-render affected lines
changedLines.forEach(line => editor.render.renderLine(line));
```

### Managing Caret Position
```javascript
const caret = editor.render.caret;

// Place caret at character index
caret.placeAt(10);

// Place caret at screen coordinates
caret.placeAtCoordinates(lineElement, 100, 50);

// Add tab stops
caret.addTabStop(5);
caret.addTabStop(10);

// Jump to next tab stop
caret.jumpToNextTabStops();
```

---

*This documentation covers all exported functions and classes from the editor modules. For implementation details and internal methods, refer to the source code.*

