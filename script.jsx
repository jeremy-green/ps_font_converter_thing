/*****************************************************************
 *
 * TextExport 1.3 - by Bramus! - http://www.bram.us/
 * Licensed under the Creative Commons Attribution 2.5 License - http://creativecommons.org/licenses/by/2.5/
 *
 *****************************************************************/
var useDialog = true,
openFile = true,
base;

function initTextExport() {
  // Linefeed shizzle
  if ($.os.search(/windows/i) != -1) {
    fileLineFeed = "windows";
  } else {
    fileLineFeed = "macintosh";
  }

  // Do we have a document open?
  if (app.documents.length === 0) {
    alert("Please open at least one file", "TextExport Error", true);
    return;
  }

  // Oh, we have more than one document open!
  if (app.documents.length > 1) {

    var runMultiple = confirm("TextExport has detected Multiple Files.\nDo you wish to run TextExport on all opened files?", true, "TextExport");

    if (runMultiple === true) {
      docs = app.documents;
    } else {
      docs = [app.activeDocument];
    }

  } else {
    runMultiple   = false;
    docs = [app.activeDocument];
  }

  base = prompt('To use em\'s, enter base font size');
  if (base == null) {
    base = false;
  }

  // Loop all documents
  for (var i = 0; i < docs.length; i++) {

    // useDialog (but not when running multiple
    if ( (runMultiple !== true) && (useDialog === true) ) {

      // Pop up save dialog
      /*var saveFile = File.saveDialog("Please select a file to export the text to:");

      // User Cancelled
      if(saveFile == null) {
        alert("User Cancelled");
        return;
      }*/

      // set filePath and fileName to the one chosen in the dialog
      filePath = Folder.myDocuments + '/' + docs[i].name + '.scss';


    } else {

      // Auto set filePath and fileName
      filePath = Folder.myDocuments + '/' + docs[i].name + '.scss';

    }

    // create outfile
    var fileOut  = new File(filePath);

    // clear dummyFile
    dummyFile = null;

    // set linefeed
    fileOut.linefeed = fileLineFeed;

    // open for write
    fileOut.open("w", "TEXT", "????");

    // Append title of document to file
    fileOut.writeln(formatSeparator(["START TextExport for " + docs[i].name]));

    // Set active document
    app.activeDocument = docs[i];

    // call to the core with the current document
    goTextExport2(app.activeDocument, fileOut, '/');

    //  Hammertime!
    fileOut.writeln(formatSeparator(["FINISHED TextExport for " + docs[i].name]));

    // close the file
    fileOut.close();

    // Give notice that we're done or open the file (only when running 1 file!)
    if (runMultiple === false) {
      if (openFile === true) {
              fileOut.execute();
      } else {
        alert("File was saved to:\n" + Folder.decode(filePath), "TextExport");
      }
    }
  }

  if (runMultiple === true) {
    alert("Parsed " + documents.length + " files;\nFiles were saved in your documents folder", "TextExport");
  }
}


/**
 * TextExport Core Function (V2)
 * -------------------------------------------------------------
*/
function goTextExport2(el, fileOut, path) {

  // Get the layers
  var layers = el.layers;

  // Loop 'm
  for (var layerIndex = layers.length; layerIndex > 0; layerIndex--) {

    // curentLayer ref
    var currentLayer = layers[layerIndex-1];

    // currentLayer is a LayerSet
    if (currentLayer.typename == "LayerSet") {

      goTextExport2(currentLayer, fileOut, path + currentLayer.name + '/');

    // currentLayer is not a LayerSet
    } else {

      // Layer is visible and Text --> we can haz copy paste!
      if ( (currentLayer.visible) && (currentLayer.kind == LayerKind.TEXT) ) {
        var textItem = currentLayer.textItem;
        fileOut.writeln(formatSeparator([
          currentLayer.name,
          currentLayer.textItem.contents
        ]));

        /**
         * @todo turn the properties into an object and iterate over it
         */
        var textObj = {
          'font-size': {
            textItem.size,

          },
          'color': textItem.color.rgb.hexValue,
          'letter-spacing': textItem.tracking,
          'font-family': textItem.font
        };
        for (prop in textObj) {
          if (prop === 'color') {
            textObj[prop] = '#' + textObj[prop];
          }
          fileOut.writeln(formatSelector(layerIndex, prop, ))
        }
        /*fileOut.writeln(formatSelector(layerIndex, 'font-size', formatUnit(handleRound(textItem.size))));
        fileOut.writeln(formatSelector(layerIndex, 'color', '#' + textItem.color.rgb.hexValue));
        fileOut.writeln(formatSelector(layerIndex, 'letter-spacing', formatUnit(getLetterSpacing(handleRound(textItem.tracking)))));
        fileOut.writeln(formatSelector(layerIndex, 'font-family', textItem.font));*/

      }
    }
  }
}

function convertEm(px) {
  return px / base;
}

function formatComment(txt) {
  return '//  ' + txt;
}

function formatUnit(value) {
  if (base) {
    value = convertEm(value);
    return value.toString() + 'em';
  }
  return value.toString() + 'px';
}

function formatSelector(index, property, value) {
  return [
    '%layer' + index + ' {',
    '  ' + property + ': ' + value + ';',
    '}'
  ].join('\n');
}

function formatSeparator(arr) {

  /**
   * Photoshop doesnt support map
    txt = arr.map(function(item) {
      return formatComment(item);
    }).join('\n');
  */

  for (var i = arr.length - 1; i >= 0; i--) {
    arr[i] = formatComment(arr[i]);
  };
  return [
    "//-----------------------------------------------------------------------",
    arr.join('\n'),
    "//-----------------------------------------------------------------------"
  ].join('\n');
}

function getLetterSpacing(num) {
  return num * 0.01;
}

function getLineHeight(px, lh) {
  return lh/px;
}

function handleRound(num) {
  if (num == 0) {
    return num;
  }
  return Math.round(num * 100) / 100;
}


/**
 *  TextExport Boot her up
 * -------------------------------------------------------------
 */
initTextExport();