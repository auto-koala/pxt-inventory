//% color="#fc9630" icon="\uf468" block="Inventory"
//% groups="['Items', 'Create', 'Customise', 'Select', 'Read', 'Modify', 'Operations', 'Query']"
namespace inventory {
    const itemRegistry: Item[] = []
    const inventoryRegistry: Inventory[] = []

    let slotSelectedEvent: (targetInventory: Inventory, selectedColumn: number, selectedRow: number) => void = null
    let itemSelectedEvent: (targetInventory: Inventory, selectedItem: Item) => void = null

    /**
     * Enum representing an item ID
     */
    //% shim=ENUM_GET
    //% blockId=item_enum_shim
    //% block="$arg"
    //% group="Items"
    //% weight=1
    //% enumName="Items"
    //% enumMemberName="item"
    //% enumPromptHint="e.g. Sword, Apple, ..."
    //% enumInitialMembers="Sword"
    export function _itemEnumShim(arg: number) {
        return arg;
    }

    /**
     * Returns an Item from an item ID.
     * Returns null if no item has been created with that ID.
     * @param itemID item ID of the item
     */
    //% blockId=get_item_from_id
    //% block="get item from id $itemId"
    //% group="Items"
    //% weight=145
    //% itemId.shadow=item_enum_shim
    export function getItemFromId(itemId: number) {
        if (itemId >= 0 && itemId < itemRegistry.length) {
            return itemRegistry[itemId]
        }
        return null
    }


    /**
     * Creates a new item.
     * @param itemID unique ID of the item
     * @param image image of the item that will be displayed in the inventory slot
     * @param stackSize the maximum amount of items that will fit in a single slot
     * @param displayName the name of the item
     */
    //% blockId=create_item
    //% block="create item $id image $image || stack size $stackSize display name $name"
    //% group="Items"
    //% weight=150
    //% inlineInputMode=inline
    //% expandableArgumentExtract=1
    //% id.shadow=item_enum_shim
    //% image.shadow=screen_image_picker
    //% name.defl="Item"
    //% stackSize.defl=16
    export function createItem(id: number, image: Image, stackSize?: number, name?: string) {
        if (getItemFromId(id) !== null) {
            throw "ERROR: Item already exists with that ID"
        }
        let newItem = new Item(id, name, image, stackSize)
        itemRegistry.push(newItem)
    }

    /**
     * Creates a grid like inventory which can be used to store items.
     * @param columns number of columns in the inventory
     * @param rows number of rows in the inventory
     * @param spacing how far apart each inventory slot is
     * @param slotSize the size (side length) of each slot
     * @param slotBorderThickness the thickness of each slot's border
     * @param slotBackgroundColor the color of each slot's background
     * @param slotUnselectedBorderColor the color of the slot's border when unselected
     * @param slotSelectedBorderColor the color of the slot's border when selected
     */
    //% blockId=create_inventory
    //% block="create inventory|columns $cols|rows $rows||spacing $spacing|slot size $slotSize|slot border thickness $slotBorderThickness|slot background color $slotBackgroundColor|unselected slot border color $slotUnselectedBorderColor|selected slot border color $slotSelectedBorderColor"
    //% group="Create"
    //% blockSetVariable=myInventory
    //% expandableArgumentExtract=3
    //% cols.defl=5
    //% rows.defl=3
    //% spacing.defl=2
    //% slotSize.defl=16
    //% slotBorderThickness.defl=1
    //% slotBackgroundColor.defl=12
    //% slotBackgroundColor.shadow="colorindexpicker" 
    //% slotUnselectedBorderColor.defl=11
    //% slotUnselectedBorderColor.shadow="colorindexpicker"
    //% slotSelectedBorderColor.defl=5
    //% slotSelectedBorderColor.shadow="colorindexpicker"
    //% weight=100
    export function createInventory(cols: number, rows: number, spacing: number = 2, slotSize: number = 16, slotBorderThickness: number = 1, slotBackgroundColor: number = 12,
        slotUnselectedBorderColor: number = 11, slotSelectedBorderColor: number = 5) {
        let newInventory: Inventory = new Inventory(cols, rows, spacing, slotSize, slotBorderThickness, slotBackgroundColor, slotUnselectedBorderColor, slotSelectedBorderColor)
        inventoryRegistry.push(newInventory)
        newInventory.slotSelectedEvent = slotSelectedEvent
        newInventory.itemSelectedEvent = itemSelectedEvent
        return newInventory
    }


    // Events
    /**
     * Fires when a slot has been selected.
     */
    //% block="on slot selected $targetInventory $selectedColumn $selectedRow"
    //% group="Select"
    //% weight=20
    //% draggableParameters
    export function onSlotSelected(handler: (targetInventory: Inventory, selectedColumn: number, selectedRow: number) => void) {
        slotSelectedEvent = handler
        for (let i = 0; i < inventoryRegistry.length; i++) {
            inventoryRegistry[i].slotSelectedEvent = handler
        }
    }

    /**
     * Fires when an item has been selected.
     */
    //% block="on item selected $targetInventory $selectedItem"
    //% group="Select"
    //% weight=10
    //% draggableParameters
    export function onItemSelected(handler: (targetInventory: Inventory, selectedItem: Item) => void) {
        itemSelectedEvent = handler
        for (let i = 0; i < inventoryRegistry.length; i++) {
            inventoryRegistry[i].itemSelectedEvent = handler
        }
    }

}


// Class for the inventory slot
//% blockNamespace=inventory
class InventorySlot {
    // Class Attributes
    public itemId: number = null
    public itemCount: number = 0

    // Constructor
    constructor(itemId: number = null, itemCount: number = 0) {
        this.itemId = itemId
        this.itemCount = itemCount
    }
}

// Class for the inventory
//% blockNamespace=inventory
class Inventory extends Sprite {
    // Class attributes
    private _columns: number
    private _rows: number
    private _slotSize: number
    private _slotBorderThickness: number
    private _slotSpacing: number
    private slots: InventorySlot[][]
    private _slotBackgroundColor: number
    private _slotUnselectedBorderColor: number
    private _slotSelectedBorderColor: number
    slotSelectedEvent: (targetInventory: Inventory, selectedColumn: number, selectedRow: number) => void
    itemSelectedEvent: (targetInventory: Inventory, selectedItem: Item) => void
    private _selectedColumn: number = 0
    private _selectedRow: number = 0
    private _selectionEnabled: boolean = true

    private padding: number = 0


    // Creates Inventory
    constructor(cols: number, rows: number, spacing: number, slotSize: number = 16, slotBorderThickness: number = 1, slotBackgroundColor: number = 12,
        slotUnselectedBorderColor: number = 11, slotSelectedBorderColor: number = 5) {

        // Calls super class
        super(image.create(slotSize * cols + spacing * (cols - 1), slotSize * rows + spacing * (rows - 1)))

        this.setFlag(SpriteFlag.RelativeToCamera, true)

        // Error handling
        if (cols < 1) { throw "InventoryError - Invalid data for cols, must be bigger than 0" }
        if (rows < 1) { throw "InventoryError - Invalid data for rows, must be bigger than 0" }
        if (spacing < 0) { throw "InventoryError - Invalid data for spacing, cannot be negative" }
        if (slotSize < 3) { throw "InventoryError - Invalid data for slot size, must be at least 3" }
        if (slotBorderThickness < 1) { throw "InventoryError - Invalid data for slot border thickness, must be bigger than 0" }
        if (slotBorderThickness * 2 >= slotSize) { throw "InventoryError - Invalid data for slot border thickness, too large compared to slot size" }
        if (slotBackgroundColor < 0 || slotBackgroundColor > 15) { throw "InventoryError - Invalid colour index for slot background colour" }
        if (slotUnselectedBorderColor < 0 || slotUnselectedBorderColor > 15) { throw "InventoryError - Invalid colour index for slot unselected border colour" }
        if (slotSelectedBorderColor < 0 || slotSelectedBorderColor > 15) { throw "InventoryError - Invalid colour index for slot selected border colour" }

        // Initialise attributes
        this._columns = cols
        this._rows = rows
        this.x = screen.width / 2
        this.y = screen.height / 2
        this.z = 100
        this._slotSize = slotSize
        this._slotBorderThickness = slotBorderThickness
        this._slotSpacing = spacing
        this.slots = []
        this._slotBackgroundColor = slotBackgroundColor
        this._slotUnselectedBorderColor = slotUnselectedBorderColor
        this._slotSelectedBorderColor = slotSelectedBorderColor
        this._selectedColumn = 0
        this._selectedRow = 0
        this._selectionEnabled = true

        // Create slots
        for (let r: number = 0; r < rows; r++) {
            this.slots.push([])
            for (let c: number = 0; c < cols; c++) {
                this.slots[r].push(new InventorySlot)
            }
        }

        this.redraw()
    }


    // Redraws inventory
    private redraw() {
        const CHAR_WIDTH: number = 6
        const CHAR_HEIGHT: number = 6

        // Decide on padding based on how much characters peek out
        this.padding = 6

        for (let r: number = 0; r < this.rows; r++) {
            let rightmostSlot = this.slots[r][this.columns - 1]
            if (((convertToText(rightmostSlot.itemCount).length * CHAR_WIDTH) / 2) > this.padding) {
                this.padding = (convertToText(rightmostSlot.itemCount).length * CHAR_WIDTH) / 2
            }
        }


        // Store x and y coordinates to preserve them if image is resized
        let savedX: number = this.x
        let savedY: number = this.y

        // Initialise updated inventory image
        let updatedImage: Image = image.create(this.slotSize * this.columns + this.slotSpacing * (this.columns - 1) + this.padding * 2,
            this.slotSize * this.rows + this.slotSpacing * (this.rows - 1) + this.padding * 2)

        // Draw slots to image
        let slot: InventorySlot = null
        let slotItem: Item = null
        for (let r: number = 0; r < this.rows; r++) {
            for (let c: number = 0; c < this.columns; c++) {
                // Get slot info for current slot
                slot = this.slots[r][c]
                slotItem = inventory.getItemFromId(slot.itemId)


                // Draw slot borders
                if (this.selectionEnabled && c == this.selectedColumn && r == this.selectedRow) {
                    updatedImage.fillRect(this.padding + (this.slotSize + this.slotSpacing) * c, this.padding + (this.slotSize + this.slotSpacing) * r,
                        this.slotSize, this.slotSize, this.slotSelectedBorderColor)
                } else {
                    updatedImage.fillRect(this.padding + (this.slotSize + this.slotSpacing) * c, this.padding + (this.slotSize + this.slotSpacing) * r,
                        this.slotSize, this.slotSize, this.slotUnselectedBorderColor)
                }

                // Draw slot backgrounds
                updatedImage.fillRect(this.padding + (this.slotSize + this.slotSpacing) * c + this.slotBorderThickness, this.padding + (this.slotSize + this.slotSpacing) * r + this.slotBorderThickness,
                    this.slotSize - this.slotBorderThickness * 2, this.slotSize - this.slotBorderThickness * 2, this.slotBackgroundColor)

                // Draw slot items
                if (slotItem) {
                    updatedImage.blit(this.padding + (this.slotSize + this.slotSpacing) * c + this.slotBorderThickness, this.padding + (this.slotSize + this.slotSpacing) * r + this.slotBorderThickness,
                        this.slotSize - this.slotBorderThickness * 2, this.slotSize - this.slotBorderThickness * 2, slotItem.image, 0, 0, slotItem.image.width, slotItem.image.height, true, false)
                }
            }
        }

        // Slight offsets for item count text
        let itemCountTextXOffset: number = -1
        let itemCountTextYOffset: number = -2

        // Draw slot text
        for (let r: number = 0; r < this.rows; r++) {
            for (let c: number = 0; c < this.columns; c++) {
                slot = this.slots[r][c]
                if (slot.itemCount > 1) {
                    // Draw text outline
                    for (let outlineYOffset = -1; outlineYOffset < 2; outlineYOffset++) {
                        for (let outlineXOffset = -1; outlineXOffset < 2; outlineXOffset++) {
                            updatedImage.print(convertToText(slot.itemCount), this.padding + this.slotSize * (c + 1) + this.slotSpacing * c - (convertToText(slot.itemCount).length * CHAR_WIDTH) / 2 + itemCountTextXOffset + outlineXOffset,
                                this.padding + this.slotSize * (r + 1) + this.slotSpacing * r - CHAR_HEIGHT / 2 + itemCountTextYOffset + outlineYOffset, 15, image.font8)
                        }
                    }
                    // Draw text
                    updatedImage.print(convertToText(slot.itemCount), this.padding + this.slotSize * (c + 1) + this.slotSpacing * c - (convertToText(slot.itemCount).length * CHAR_WIDTH) / 2 + itemCountTextXOffset,
                        this.padding + this.slotSize * (r + 1) + this.slotSpacing * r - CHAR_HEIGHT / 2 + itemCountTextYOffset, 1, image.font8)
                }
            }
        }

        // Update image
        this.setImage(updatedImage)
        this.x = savedX
        this.y = savedY

    }


    // Get columns
    //% blockCombine
    //% group="Customise"
    //% blockSetVariable=myInventory
    //% weight=89
    get columns() {
        return this._columns
    }

    // Set columns
    //% blockCombine
    //% group="Customise"
    //% blockSetVariable=myInventory
    //% weight=99
    set columns(columns: number) {
        if (columns > 0) {
            if (columns > this.columns) {
                // Add new columns
                for (let r: number = 0; r < this.rows; r++) {
                    for (let i: number = 0; i < (columns - this.columns); i++) {
                        this.slots[r].push(new InventorySlot)
                    }
                }
            } else {
                // Move selected column if deleted
                if (this.selectedColumn >= columns) {
                    this.selectedColumn = columns - 1
                }

                // Remove columns
                for (let r: number = 0; r < this.rows; r++) {
                    for (let i: number = 0; i < (this.columns - columns); i++) {
                        this.slots[r].pop()
                    }
                }
            }

            this._columns = columns

            this.redraw()
        } else {
            throw "InventoryError - Must have at least 1 column"
        }
    }

    // Get rows
    //% blockCombine
    //% group="Customise"
    //% blockSetVariable=myInventory
    //% weight=88
    get rows() {
        return this._rows
    }

    // Set rows
    //% blockCombine
    //% group="Customise"
    //% blockSetVariable=myInventory
    //% weight=98
    set rows(rows: number) {
        if (rows > 0) {
            if (rows > this.rows) {
                // Add new rows
                for (let i: number = 0; i < (rows - this.rows); i++) {
                    let newRow: InventorySlot[] = []
                    for (let c: number = 0; c < this.columns; c++) {
                        newRow.push(new InventorySlot)
                    }
                    this.slots.push(newRow)
                }

            } else {
                // Move selected row if deleted
                if (this.selectedRow >= rows) {
                    this.selectedRow = rows - 1
                }

                // Remove rows
                for (let i: number = 0; i < (this.rows - rows); i++) {
                    this.slots.pop()
                }
            }

            this._rows = rows

            this.redraw()
        } else {
            throw "InventoryError - Must have at least 1 row"
        }
    }

    // Get selected column
    //% blockCombine
    //% group="Customise"
    //% blockSetVariable=myInventory
    //% weight=99
    get selectedColumn() {
        if (this.selectionEnabled) {
            return this._selectedColumn
        } else {
            return null
        }
    }

    // Set selected column
    //% blockCombine
    //% group="Customise"
    //% blockSetVariable=myInventory
    //% weight=99
    set selectedColumn(column: number) {
        if (this.selectionEnabled && column >= 0 && column < this.columns) {
            this._selectedColumn = column
            this.redraw()

            // Trigger itemSelectedEvent
            if (this.itemSelectedEvent) {
                this.itemSelectedEvent(this, inventory.getItemFromId(this.slots[this.selectedRow][this.selectedColumn].itemId))
            }

            // Trigger slotSelectedEvent
            if (this.slotSelectedEvent) {
                this.slotSelectedEvent(this, this.selectedColumn, this.selectedRow)
            }
        }
    }

    // Get selected row
    //% blockCombine
    //% group="Customise"
    //% blockSetVariable=myInventory
    //% weight=99
    get selectedRow() {
        if (this.selectionEnabled) {
            return this._selectedRow
        } else {
            return null
        }
    }

    // Set selected row
    //% blockCombine
    //% group="Customise"
    //% blockSetVariable=myInventory
    //% weight=99
    set selectedRow(row: number) {
        if (this.selectionEnabled && row >= 0 && row < this.rows) {
            this._selectedRow = row
            this.redraw()

            // Trigger itemSelectedEvent
            if (this.itemSelectedEvent) {
                this.itemSelectedEvent(this, inventory.getItemFromId(this.slots[this.selectedRow][this.selectedColumn].itemId))
            }

            // Trigger slotSelectedEvent
            if (this.slotSelectedEvent) {
                this.slotSelectedEvent(this, this.selectedColumn, this.selectedRow)
            }
        }
    }

    // Gets slot size
    //% blockCombine
    //% group="Customise"
    //% blockSetVariable=myInventory
    //% weight=99
    get slotSize() {
        return this._slotSize
    }

    // Sets slot size
    //% blockCombine
    //% group="Customise"
    //% blockSetVariable=myInventory
    //% weight=99
    set slotSize(size: number) {
        if (size > this.slotBorderThickness * 2) {
            this._slotSize = size

            // Redraw hotbar
            this.redraw()
        }
    }

    // Gets slot border thickness
    //% blockCombine
    //% group="Customise"
    //% blockSetVariable=myInventory
    //% weight=99
    get slotBorderThickness() {
        return this._slotBorderThickness
    }

    // Sets slot border thickness
    //% blockCombine
    //% group="Customise"
    //% blockSetVariable=myInventory
    //% weight=99
    set slotBorderThickness(weight: number) {
        if ((weight >= 1) && (weight * 2 <= this.slotSize - 1)) {
            this._slotBorderThickness = weight

            // Redraw images
            this.redraw()
        }
    }

    // Gets slot spacing
    //% blockCombine
    //% group="Customise"
    //% blockSetVariable=myInventory
    //% weight=99
    get slotSpacing() {
        return this._slotSpacing
    }

    // Sets slot spacing
    //% blockCombine
    //% group="Customise"
    //% blockSetVariable=myInventory
    //% weight=99
    set slotSpacing(spacing: number) {
        if (spacing >= 0) {
            this._slotSpacing = spacing

            this.redraw()
        }
    }

    // Gets slot background color
    //% blockCombine
    //% group="Customise"
    //% blockSetVariable=myInventory
    //% weight=99
    get slotBackgroundColor() {
        return this._slotBackgroundColor
    }

    // Sets slot background color
    /**
     * Sets the color of each slot's background.
     * @param backgroundColor background color
     */
    //% block="$this set slot background color $backgroundColor"
    //% group="Customise"
    //% weight=3
    //% this.defl=myInventory
    //% this.shadow=variables_get
    //% backgroundColor.defl=12
    //% backgroundColor.shadow="colorindexpicker" 
    setSlotBackgroundColor(backgroundColor: number) {
        if (backgroundColor >= 0 && backgroundColor < 16) {
            this._slotBackgroundColor = backgroundColor
            this.redraw()
        }
    }

    // Gets unselected border color
    //% blockCombine
    //% group="Customise"
    //% blockSetVariable=myInventory
    //% weight=99
    get slotUnselectedBorderColor() {
        return this._slotUnselectedBorderColor
    }

    // Sets unselected border color
    /**
     * Sets the color of a slot's border when unselected.
     * @param borderColor border color
     */
    //% block="$this set unselected slot border color $borderColor"
    //% group="Customise"
    //% weight=2
    //% this.defl=myInventory
    //% this.shadow=variables_get
    //% borderColor.defl=11
    //% borderColor.shadow="colorindexpicker" 
    setSlotUnselectedBorderColor(borderColor: number) {
        if (borderColor >= 0 && borderColor < 16) {
            this._slotUnselectedBorderColor = borderColor
            this.redraw()
        }

    }

    // Gets selected border color
    //% blockCombine
    //% group="Customise"
    //% blockSetVariable=myInventory
    //% weight=99
    get slotSelectedBorderColor() {
        return this._slotSelectedBorderColor
    }


    /**
     * Sets the color of a slot's border when selected.
     * @param borderColor border color
     */
    //% block="$this set selected slot border color $borderColor"
    //% group="Customise"
    //% weight=1
    //% this.defl=myInventory
    //% this.shadow=variables_get
    //% borderColor.defl=5
    //% borderColor.shadow="colorindexpicker" 
    setSlotSelectedBorderColor(borderColor: number) {
        console.log(borderColor)
        if (borderColor >= 0 && borderColor < 16) {
            this._slotSelectedBorderColor = borderColor
            this.redraw()

        }
    }

    //% blockCombine
    //% group="Select"
    //% blockSetVariable=myInventory
    //% weight=99
    get selectionEnabled() {
        return this._selectionEnabled
    }


    // Events

    /**
     * Gets the item stored at a given slot location.
     * Returns null if there is no item at that slot.
     * @param col column of the item's slot
     * @param row row of the item's slot
     */
    //% block="$this item at col $col row $row"
    //% group="Read"
    //% weight=40
    //% this.defl=myInventory
    //% this.shadow=variables_get
    //% col.defl=0
    //% row.defl=0
    itemAt(col: number, row: number): Item {
        if (col >= 0 && col < this.columns && row >= 0 && row < this.rows) {
            return inventory.getItemFromId(this.slots[row][col].itemId)
        } else {
            throw "ERROR: Could not get slot - Invalid location"
        }
    }

    /**
     * Gets how items are stored at a given slot location.
     * @param col column of the slot
     * @param row row of the slot
     */
    //% block="$this item count at col $col row $row"
    //% group="Read"
    //% weight=30
    //% this.defl=myInventory
    //% this.shadow=variables_get
    //% col.defl=0
    //% row.defl=0
    itemCountAt(col: number, row: number): number {
        if (col >= 0 && col < this.columns && row >= 0 && row < this.rows) {
            return this.slots[row][col].itemCount
        } else {
            throw "ERROR: Could not get slot - Invalid location"
        }
    }

    /**
     * Gets the item stored in the slot at a given position (relative to camera).
     * Returns null if position isn't in a slot.
     * @param x x position of the slot
     * @param y y position of the slot
     */
    //% block="$this item at position x $x y $y"
    //% group="Read"
    //% weight=20
    //% this.defl=myInventory
    //% this.shadow=variables_get
    //% x.defl=0
    //% y.defl=0
    itemAtPosition(x: number, y: number): Item {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                // Checks if position is in rect of slot
                if (((x - this.left - this.padding) >= (c * (this.slotSize + this.slotSpacing))) && ((x - this.left - this.padding) <= ((c + 1) * this.slotSize + c * this.slotSpacing)) &&
                    ((y - this.top - this.padding) >= (r * (this.slotSize + this.slotSpacing))) && ((y - this.top - this.padding) <= ((r + 1) * this.slotSize + r * this.slotSpacing))) {
                    return inventory.getItemFromId(this.slots[r][c].itemId)
                }
            }
        }

        return null
    }

    /**
     * Gets the how many items are stored in the slot at a given position (relative to camera).
     * Returns null if position isn't in a slot.
     * @param x x position of the slot
     * @param y y position of the slot
     */
    //% block="$this item count at position x $x y $y"
    //% group="Read"
    //% weight=10
    //% this.defl=myInventory
    //% this.shadow=variables_get
    //% x.defl=0
    //% y.defl=0
    itemCountAtPosition(x: number, y: number): number {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                // Checks if position is in rect of slot
                if (((x - this.left - this.padding) >= (c * (this.slotSize + this.slotSpacing))) && ((x - this.left - this.padding) <= ((c + 1) * this.slotSize + c * this.slotSpacing)) &&
                    ((y - this.top - this.padding) >= (r * (this.slotSize + this.slotSpacing))) && ((y - this.top - this.padding) <= ((r + 1) * this.slotSize + r * this.slotSpacing))) {
                    return this.slots[r][c].itemCount
                }
            }
        }

        return null
    }

    /**
     * Sets the item and item count of a slot at a given slot location.
     * @param col column of the slot
     * @param row row of the slot
     * @param itemId item id of the item in the slot
     * @param itemCount number of items in the slot
     */
    //% block="$this set slot at col $col row $row to $itemId count $itemCount"
    //% group="Modify"
    //% weight=67
    //% inlineInputMode=inline
    //% this.defl=myInventory
    //% this.shadow=variables_get
    //% col.defl = 0
    //% row.defl = 0
    //% itemId.shadow=item_enum_shim
    //% itemCount.defl=1
    setSlot(col: number, row: number, itemId: number, itemCount: number) {
        if (col >= 0 && col < this.columns && row >= 0 && row < this.rows) {
            // Empty slot
            if (itemId === null || itemCount == 0) {
                this.slots[row][col].itemId = null
                this.slots[row][col].itemCount = 0
                this.redraw()
            } else {
                let item: Item = inventory.getItemFromId(itemId)
                // Non empty slot
                if (itemCount > 0 && item && itemCount <= item.stackSize) {
                    this.slots[row][col].itemId = itemId
                    this.slots[row][col].itemCount = itemCount
                    this.redraw()
                }
            }
        }
    }

    /**
     * Selects a slot at a given slot location.
     * @param col column of the slot
     * @param row row of the slot
     */
    //% block="$this select slot at col $col row $row"
    //% group="Select"
    //% weight=69
    //% this.defl=myInventory
    //% this.shadow=variables_get
    //% col.defl = 0
    //% row.defl = 0
    selectSlot(col: number, row: number) {
        if (this.selectionEnabled && col >= 0 && col < this.columns && row >= 0 && row < this.rows) {
            this._selectedColumn = col
            this._selectedRow = row

            // Trigger itemSelectedEvent
            // The reason we DIDNT change attributes using getters and setters is so that this event wouldnt be called twice
            if (this.itemSelectedEvent) {
                this.itemSelectedEvent(this, inventory.getItemFromId(this.slots[row][col].itemId))
            }

            if (this.slotSelectedEvent) {
                this.slotSelectedEvent(this, col, row)
            }

            this.redraw()
        }
    }

    /**
     * Selects a slot at a given position (relative to camera).
     * If position isn't in a slot, the previous selected slot will remain selected.
     * @param x x position of the slot
     * @param y y position of the slot
     */
    //% block="$this select slot at position x $x y $y"
    //% group="Select"
    //% weight=68
    //% this.defl=myInventory
    //% this.shadow=variables_get
    //% x.defl = 0
    //% y.defl = 0
    selectSlotAtPosition(x: number, y: number) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                // Checks if position is in rect of slot
                if (((x - this.left - this.padding) >= (c * (this.slotSize + this.slotSpacing))) && ((x - this.left - this.padding) <= ((c + 1) * this.slotSize + c * this.slotSpacing)) &&
                    ((y - this.top - this.padding) >= (r * (this.slotSize + this.slotSpacing))) && ((y - this.top - this.padding) <= ((r + 1) * this.slotSize + r * this.slotSpacing))) {
                    this.selectSlot(c, r)
                    return
                }
            }
        }
    }

    /**
     * Toggles whether slot selection is enabled. Turn off if you don't want any slots to be selected.
     * @param enabled whether the selection is enabled
     */
    //% block="$this turn selection $enabled"
    //% group="Select"
    //% weight=67
    //% this.defl=myInventory
    //% this.shadow=variables_get
    //% enabled.defl=false
    //% enabled.shadow="toggleOnOff"
    setSelectionEnabled(enabled: boolean) {
        this._selectionEnabled = enabled;
        this.redraw();
    }

    // This functions similar to Sprite.overlapsWith(), which cannot be used as this sprite is relative to camera
    /**
     * Checks if a given position is in a slot.
     * @param x x position
     * @param y y position
     */
    //% block="$this slot exists at position x $x y $y"
    //% group="Query"
    //% this.defl=myInventory
    //% this.shadow=variables_get
    //% x.defl = 0
    //% y.defl = 0
    slotExistsAtPosition(x: number, y: number): boolean {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                // Checks if position is in rect of slot
                if (((x - this.left - this.padding) >= (c * (this.slotSize + this.slotSpacing))) && ((x - this.left - this.padding) <= ((c + 1) * this.slotSize + c * this.slotSpacing)) &&
                    ((y - this.top - this.padding) >= (r * (this.slotSize + this.slotSpacing))) && ((y - this.top - this.padding) <= ((r + 1) * this.slotSize + r * this.slotSpacing))) {
                    return true
                }
            }
        }

        return false
    }


    /**
     * Checks if an item (or a fixed amount of items) can be inserted into the inventory.
     * Returns true if there is enough inventory space to insert all of the items and false if otherwise.
     * @param x x position
     * @param y y position
     * @param amount amount of items to check
     */
    //% block="$this can insert item id $itemId || amount $amount"
    //% group="Query"
    //% this.defl=myInventory
    //% this.shadow=variables_get
    //% itemId.shadow=item_enum_shim
    //% amount.defl=1
    canInsertItem(itemId: number, amount: number = 1): boolean {
        let item: Item = inventory.getItemFromId(itemId)
        if (item === null) {
            throw "InventoryError - Invalid item ID"
        }
        if (amount < 1) {
            throw "InventoryError - Amount cannot be less than 1"
        }

        let slot: InventorySlot = null
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                slot = this.slots[r][c]
                // If item already in inventory and not a full stack or slot is empty
                if (slot.itemCount == 0) {
                    amount -= item.stackSize
                } else if (slot.itemId == itemId && slot.itemCount < item.stackSize) {
                    amount -= item.stackSize - slot.itemCount
                }

                // If all the items can be inserted, amount will drop to below 1
                if (amount < 1) {
                    return true
                }
            }
        }

        return false
    }

    // Inserts items into the hotbar (if possible)
    // Strict mode will not insert any items if all of them cannot be inserted
    /**
     * Inserts an item, or multiple items, into the inventory (if possible).
     * If there is not enough space for all items, this block will attempt to insert as many items as possible, unless strict mode is enabled, in which case no items will be inserted.
     * @param itemId ID of the item to be inserted
     * @param amount amount of items which should be inserted
     * @param strict when this flag is enabled, the items will only be inserted if all of them can be
     */
    //% block="$this insert id $itemId||amount $amount strict mode $strict"
    //% group="Modify"
    //% weight=66
    //% inlineInputMode=inline
    //% this.defl=myInventory
    //% this.shadow=variables_get
    //% itemId.shadow=item_enum_shim
    //% amount.defl=1
    //% strict.shadow="toggleOnOff"
    //% strict.defl=false
    insert(itemId: number, amount: number = 1, strict: boolean = false) {
        let item: Item = inventory.getItemFromId(itemId)
        if (item === null) {
            throw "InventoryError - Invalid item ID"
        }
        if (amount < 1) {
            throw "InventoryError - Amount cannot be less than 1"
        }


        let slot: InventorySlot = null

        // Strict mode will check if there are enough available spaces to continue
        if (strict) {
            // Available spaces for the item
            let availableSpaces: number = 0

            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.columns; c++) {
                    slot = this.slots[r][c]
                    // If slot is empty, all spaces can be used to fill with item
                    if (slot.itemCount == 0) {
                        availableSpaces += item.stackSize
                        // If slot contains chosen item then the remaining spaces can be used
                    } else if (slot.itemId == itemId) {
                        availableSpaces += item.stackSize - slot.itemCount
                    }
                }
            }

            // Quit if not enough available spaces
            if (amount > availableSpaces) {
                return
            }
        }

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                slot = this.slots[r][c]
                // If item already in inventory and not a full stack
                while (slot.itemId == itemId && slot.itemCount < item.stackSize) {
                    slot.itemCount += 1
                    amount -= 1

                    if (amount == 0) {
                        this.redraw()
                        return
                    }
                }
            }
        }

        // Attempt to place item in empty slot
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                slot = this.slots[r][c]
                if (slot.itemCount == 0) {
                    slot.itemId = itemId
                    slot.itemCount += 1
                    amount -= 1

                    // If empty slot is selected then the new item will be selected
                    // This should trigger an itemSelectedEvent
                    if (this.itemSelectedEvent && c == this.selectedColumn && r == this.selectedRow) {
                        this.itemSelectedEvent(this, inventory.getItemFromId(itemId))
                    }

                    // Quit if no items left to place
                    if (amount == 0) {
                        this.redraw()
                        return
                    }

                    // Continue to place items in empty slot if possible
                    while (slot.itemCount < item.stackSize) {
                        slot.itemCount += 1
                        amount -= 1

                        if (amount == 0) {
                            this.redraw()
                            return
                        }
                    }
                }
            }
        }

        this.redraw()
    }

    /**
     * Inserts an item, or multiple items, into an inventory slot (if possible).
     * If there is not enough space for all items, this block will attempt to insert as many items as possible into that slot, unless strict mode is enabled, in which case no items will be inserted.
     * @param itemId ID of the item to be inserted
     * @param col column of the slot in which the items will be inserted
     * @param row row of the slot in which the items will be inserted
     * @param amount amount of items which should be inserted
     * @param strict when this flag is enabled, the items will only be inserted if all of them can fit into that slot
     */
    //% block="$this insert item id $itemId at slot col $col row $row||amount $amount strict mode $strict"
    //% group="Modify"
    //% weight=65
    //% inlineInputMode=inline
    //% this.defl=myInventory
    //% this.shadow=variables_get
    //% itemId.shadow=item_enum_shim
    //% col.defl=0
    //% row.defl=0
    //% amount.defl=1
    //% strict.shadow="toggleOnOff"
    //% strict.defl=false
    insertItemAtSlot(itemId: number, col: number, row: number, amount: number = 1, strict: boolean = false) {
        let item: Item = inventory.getItemFromId(itemId)

        if (item === null) {
            throw "InventoryError - Invalid item ID"
        }
        if (amount < 1) {
            throw "InventoryError - Amount cannot be less than 1"
        }
        if (col < 0 || col >= this.columns || row < 0 || row >= this.rows) {
            throw "InventoryError - Slot outside inventory range"
        }

        let slot: InventorySlot = this.slots[row][col]

        if (slot.itemCount == 0) {
            // Checks if items can be placed
            if (!strict || amount <= item.stackSize) {
                slot.itemId = itemId

                // If empty slot is selected then the new item will be selected
                // This should trigger an itemSelectedEvent
                if (this.itemSelectedEvent && col == this.selectedColumn && row == this.selectedRow) {
                    this.itemSelectedEvent(this, inventory.getItemFromId(itemId))
                }


                // Add items
                slot.itemCount += Math.min(amount, item.stackSize)
                this.redraw()
            }
        } else if (slot.itemId == itemId) {
            // Checks if items can be placed
            if (!strict || amount <= (item.stackSize - slot.itemCount)) {
                // Add items
                slot.itemCount += Math.min(amount, item.stackSize - slot.itemCount)
                this.redraw()
            }
        }
    }

    /**
     * Removes an item, or multiple items, from an inventory slot (if possible).
     * If there is less items in the slot than the amount specified to removed, the slot will be cleared, unless strict mode is enabled, in which case no items will be removed.
     * @param col column of the slot to remove items
     * @param row row of the slot to remove items
     * @param amount amount of items which should be removed
     * @param strict when this flag is enabled, the items will only be removed if the amount of items to remove is not greater than the amount of items in the slot
     */
    //% block="$this remove item at col $col row $row||amount $amount strict mode $strict"
    //% group="Modify"
    //% weight=64
    //% inlineInputMode=inline
    //% this.defl=myInventory
    //% this.shadow=variables_get
    //% col.defl = 0
    //% row.defl = 0
    //% amount.defl=1
    //% strict.shadow="toggleOnOff"
    //% strict.defl=false
    removeItemAtSlot(col: number, row: number, amount: number = 1, strict: boolean = false) {
        // Returns if slotId is invalid
        if (col < 0 || col >= this.columns || row < 0 || row >= this.rows) {
            throw "InventoryError - Slot outside of inventory range"
        }

        let slot: InventorySlot = this.slots[row][col]
        if (slot.itemCount > 0) {
            if (slot.itemCount >= amount) {
                slot.itemCount -= amount
            } else if (!strict) {
                slot.itemCount = 0
            } else {
                return
            }

            // Remove item
            if (slot.itemCount == 0) {
                slot.itemId = null
                if (this.itemSelectedEvent && col == this.selectedColumn && row == this.selectedRow) {
                    this.itemSelectedEvent(this, null)
                }
            }

            this.redraw()
        }
    }

    /**
     * Clears the entire inventory, making every slot empty.
     */
    //% block="$this clear"
    //% group="Modify"
    //% weight=63
    //% this.defl=myInventory
    //% this.shadow=variables_get
    clear() {
        let slot: InventorySlot = null
        for (let r: number = 0; r < this.rows; r++) {
            for (let c: number = 0; c < this.columns; c++) {
                slot = this.slots[r][c]
                slot.itemId = null
                slot.itemCount = 0
            }
        }

        this.redraw()
    }

    /**
     * Clears a single slot.
     * @param col column of the slot which will be cleared
     * @param row row of the slot which will be cleared
     */
    //% block="$this clear slot col $col row $row"
    //% group="Modify"
    //% weight=62
    //% this.defl=myInventory
    //% this.shadow=variables_get
    //% col.defl = 0
    //% row.defl = 0
    clearSlot(col: number, row: number) {
        this.setSlot(col, row, null, 0)
    }


    // Swaps two slots
    /**
     * Swaps the items of two slots.
     * @param col1 column of the first slot which will be swapped
     * @param row1 row of the first slot which will be swapped
     * @param col2 column of the second slot which will be swapped
     * @param row2 row of the second slot which will be swapped
     */
    //% block="$this swap slots col1 $col1 row1 $row1 | col2 $col2 row2 $row2"
    //% group="Operations"
    //% weight=61
    //% inlineInputMode=inline
    //% this.defl=myInventory
    //% this.shadow=variables_get
    //% col1.defl = 0
    //% row1.defl = 0
    //% col2.defl = 0
    //% row2.defl = 0
    swapSlots(col1: number, row1: number, col2: number, row2: number) {
        if (col1 < 0 || col1 >= this.columns || row1 < 0 || row1 >= this.rows ||
            col2 < 0 || col2 >= this.columns || row2 < 0 || row2 >= this.rows) {
            throw "InventoryError - Slot outside of inventory range"
        }

        let slot1: InventorySlot = this.slots[row1][col1]
        let slot2: InventorySlot = this.slots[row2][col2]


        // Checks if a new item has been selected
        if (this.itemSelectedEvent) {
            if (col1 == this.selectedColumn && row1 == this.selectedRow) {
                this.itemSelectedEvent(this, inventory.getItemFromId(slot2.itemId))
            }
            if (col2 == this.selectedColumn && row2 == this.selectedRow) {
                this.itemSelectedEvent(this, inventory.getItemFromId(slot1.itemId))
            }
        }



        // Swap slots
        let tempItemId: number = slot2.itemId
        let tempItemCount: number = slot2.itemCount

        slot2.itemId = slot1.itemId
        slot2.itemCount = slot1.itemCount

        slot1.itemId = tempItemId
        slot1.itemCount = tempItemCount

        this.redraw()
    }
}


// New spritekind for items
namespace SpriteKind {
    export const Item = SpriteKind.create()
}


//% blockNamespace=inventory
class Item {
    readonly id: number
    //% blockCombine
    //% group="Items"
    //% weight=135
    readonly name: string
    //% blockCombine
    //% group="Items"
    //% weight=134
    readonly image: Image
    //% blockCombine
    //% group="Items"
    //% weight=133
    readonly stackSize: number

    constructor(id: number, name: string, itemImage: Image, stackSize: number) {
        this.id = id
        this.name = name
        this.image = itemImage
        this.stackSize = stackSize
    }
}

