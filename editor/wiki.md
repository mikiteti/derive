# Doc
### Read
- [x] chars, lines, words, text
- [x] line(n)
- [x] lineAt(index)
- [ ] linesBetween(line1, line2)
- [ ] textBetween(index1, index2)


### Change
- [x] delete(from, to)
- [x] insert(text, at)
- [x] replace(text, from, to)

## Line
### Read
- [x] chars, words, text
- [x] number
- [x] from, to
- [x] element
- [x] tabs
- [x] decos{deco1: true, deco2: true}

### Write
- [x] addDeco(Deco, Line|{from, to})
- [x] removeDeco(Deco)
- [x] setTabs(Line, {int full, bool half, int wide})

# Render
### Read
- [x] Caret
- [x] textarea
- [ ] Selection

### Write
- [x] renderAll()
- [x] renderLine(Line)
- [ ] renderBetween(index1, index2)

## Caret
### Read
- [x] position
- [x] tabstops[[index11, index12], [index21, index22]]
- [ ] style

### Write
- [x] placeAt(index)
- [x] placeAtCoordinates(lineElement: DOMElement, x: Float, y: Float, updateScreenX: Bool, alternativeLineElement: DOMElement)
- [x] addTabStops(indexes: [Int], index: Int, append: Bool)
- [ ] setStyle("line"|"block"|"short")

## Selection
### Read
- [ ] range
- [ ] text

### Write
- [ ] placeBetween(index1, index2)

# Input
### Read
- [x] Keyboard
- [x] textarea == render.textarea

### Listen
- [x] keyPress
- [x] click

## Keyboard
### Assign
- [x] command(event)
