# Doc
### Read
- [x] chars, lines, words, text
- [x] line(n)
- [x] lineAt(index)
- [ ] textBetween(index1, index2)
- [ ] linesBetween(line1, line2)


### Write
- [ ] insert(from, to, text)
- [ ] addDeco(Deco, Line|{from, to})
- [ ] removeDeco(Deco)
- [ ] setTabs(Line, {int full, bool half, int wide})

## Line
### Read
- [x] chars, words, text
- [x] number
- [x] from, to
- [x] element
- [ ] tabs
- [ ] decos{mark, line}

# Render
### Read
- [x] Caret
- [ ] Selection
- [x] textarea

### Write
- [x] renderAll()
- [ ] renderLine(Line)
- [ ] renderBetween(index1, index2)

## Caret
### Read
- [x] position
- [x] style

### Write
- [x] placeAtIndex(index)
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
- [x] textarea -- same as render.textarea

### Listen
- [x] keyPress
- [x] click

## Keyboard
### Assign
- [x] command(event)
