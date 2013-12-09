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

  base = prompt('To use em\'s, enter base font size.\nPress cancel to use pixels', 16);
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
    //fileOut.writeln(formatSeparator(["START TextExport for " + docs[i].name]));

    // Set active document
    app.activeDocument = docs[i];

    // call to the core with the current document
    goTextExport2(app.activeDocument, fileOut, '/');

    //  Hammertime!
    //fileOut.writeln(formatSeparator(["FINISHED TextExport for " + docs[i].name]));

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
        var font = getFont(textItem.font);
        var textObj = {
          'color': function () { try { return '#' + textItem.color.rgb.hexValue } catch (e) { return false; } },
          'font-family': function () { try { return '"' + font.family + '"' } catch (e) { return false; } },
          'font-size': function () { try { return formatUnit(handleRound(textItem.size)) } catch (e) { return false; } },
          'font-style': function () { try { return getFontStyle(textItem.fauxItalic); } catch (e) { return false; } },
          'font-weight': function () { try { return font.weight } catch (e) { return false; } },
          'font-variant': function () { try { return getTextCase(textItem.capitalization) } catch (e) { return false; } },
          'letter-spacing': function () { try { return formatUnit(getLetterSpacing(textItem.tracking)) } catch (e) { return false; } },
          'line-height': function () { try { return getLineHeight(handleRound(textItem.leading), handleRound(textItem.size)) } catch (e) { return false; } },
          'text-align': function() { try { return getTextAlign(textItem.justification); } catch (e) { return false; } },
          'text-decoration': function () { try { return getTextDecoration({'underline': textItem.underline, 'line-through': textItem.strikeThru}) } catch (e) { return false; } },
          'text-transform': function () { try { return getTextTransform(textItem.capitalization) } catch (e) { return false; } }
        };
        for (prop in textObj) {
          var val = textObj[prop].call();
          if (val) {
            fileOut.writeln(formatSelector(layerIndex, prop, val));
          } else {
            //fileOut.writeln(formatComment(prop + ' is not defined in the PSD.'));
          }
        }
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
  var i = arr.length - 1;
  for (; i >= 0; i--) {
    arr[i] = formatComment(arr[i]);
  };
  return [
    '//-----------------------------------------------------------------------',
    arr.join('\n'),
    '//-----------------------------------------------------------------------'
  ].join('\n');
}

function getFont(font) {
  var f = app.fonts.getByName(font);
  for (prop in f) {
    $.writeln(prop + ': ' + f[prop]);
  }
  return {
    'family': f.family,
    'weight': handleWeight(f.style.toLowerCase())
  };
}

function getFontStyle(fs) {
  /**
   * @todo figure out if theres a way to tell between real font italic and faux
   */
  switch (fs) {
    case true :
      //return 'oblique';
      return 'italic';
    break;
    default :
      return fase;
    break;
  }
}

function getLetterSpacing(num) {
  return num * 0.01;
}

function getLineHeight(px, lh) {
  return handleRound(px/lh);
}

function getTextAlign(justification) {
  switch (justification) {
    case Justification.CENTER:
      return 'center';
    break;
    case Justification.LEFT:
      return 'left';
    break;
    case Justification.RIGHT:
      return 'right';
    break;
    default :
      return false;
    break;
  }
}

function getTextCase(tc) {
  switch (tc) {
    case TextCase.SMALLCAPS:
      return 'small-caps';
    break;
    default :
      return false;
    break;
  }
}

function getTextDecoration(decorationObj) {
  td = [];
  if (decorationObj['underline'] != UnderlineType.UNDERLINEOFF) {
    td.push('underline');
  }
  if (decorationObj['line-through'] != StrikeThruType.STRIKEOFF) {
    td.push('line-through');
  }
  return td.join(' ');
}

function getTextTransform(tf) {
  switch (tf) {
    case TextCase.ALLCAPS:
      return 'uppercase';
    break;
    default :
      return false;
    break;
  }
}

function handleRound(num) {
  if (num == 0) {
    return num;
  }
  return Math.round(num * 100) / 100;
}

function handleWeight(style) {
  var collection = ['thin', 'extralight', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'ultrabold'],
  len = collection.length,
  i = 1;
  for (; i<=len; i++) {
    if (style == collection[i]) {
      return i * 100;
    }
  }
  return false;
}


/**
 *  TextExport Boot her up
 * -------------------------------------------------------------
 */
initTextExport();