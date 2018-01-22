# ProcessMention
ProcessWire module - "forum mention" style autocomplete for page links inside CKEditor

## Status
Alpha - needs extensive testing

## Compatibility
Currently tested with PW3 and PW2.8

## ToDo
* Make things look nicer and add documentation

## Installation
* Extract the module's zip file to site/modules (download zip from github through [this link](https://github.com/BitPoet/ProcessMention/archive/master.zip))
* Create the directory site/modules/InputfieldCKEditor/plugins/pwmentions
* Copy plugin.js from the module folder to the newly created directory
* Go to the admin and run Modules -> Refresh, then install "Mention Addon for CKEditor"
* Adapt any settings in the module's configuration (you can keep defaults, though)
* Configure the CKEditor fields (e.g. body) in which you want to use mention autocomplete
  and check the pwmentions plugin in the "Plugins" section of the "Input" tab

## Contributing
Feel free to submit issues or pull requests for any changes/improvements you'd like to see incorporated.

## License
See LICENSE for details
