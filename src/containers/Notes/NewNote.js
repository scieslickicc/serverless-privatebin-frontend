import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import {FormGroup, FormControl, ControlLabel, ButtonToolbar, ButtonGroup, Button} from "react-bootstrap";
import LoaderButton from "../../components/LoaderButton";
import PasswordMask from 'react-password-mask';
import { onError } from "../../libs/errorLib";
import "./NewNote.css";
import { API } from "aws-amplify";
import { encrypt } from "../../libs/Aes-256";
import {standarizePassword} from "../../libs/password-lib";
import Select from 'react-select';
import {ttlOptions} from "../../data/ttl-options";
import {typeOptions} from "../../data/type-options";
import { useTranslation } from 'react-i18next';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import {useAppContext} from "../../libs/contextLib";
import {SketchField, Tools} from 'react-sketch';
// import { DrawingBoard } from 'react-drawing-board';
// import prettier from "prettier/standalone";
// import parserHtml from "prettier/parser-html";


// {
//   "arrowParens": "always",
//   "bracketSpacing": true,
//   "htmlWhitespaceSensitivity": "css",
//   "insertPragma": false,
//   "jsxBracketSameLine": false,
//   "jsxSingleQuote": false,
//   "printWidth": 80,
//   "proseWrap": "preserve",
//   "quoteProps": "as-needed",
//   "requirePragma": false,
//   "semi": true,
//   "singleQuote": false,
//   "tabWidth": 2,
//   "trailingComma": "es5",
//   "useTabs": false,
//   "vueIndentScriptAndStyle": false
// }

//todo button with preattier :) - reformat code

// const newContent = prettier.format(content.code, {
//   parser: "html",
//   plugins: [parserHtml],
// });


const ttlIndex = 4;
const noteTypeIndex = 0;

export default function NewNote({
                                  initial = 3,
                                  addPasswordToUrl = false,
                                  message,
                                  addPassword,
                                  note,
                                  img = false
}) {
  const history = useHistory();
  const { t } = useTranslation();
  const { isAuthenticated, storedUserId } = useAppContext();

  if (!Number.isInteger(initial)) {
    initial = 3;
  }

  let initialNoteType;

  initialNoteType = typeOptions[noteTypeIndex].value;

  if (note) {
    if (note.type) {
      initialNoteType = note.type;
    }
  }
  if (img) {
    initialNoteType = 'image/svg+xml';
  }

  console.log(initialNoteType);

  const [telomer, setTelomer] = useState(note && note.telomer ? note.telomer : initial);
  const [ttl, setTtl] = useState(note && note.ttl ? note.ttl : ttlOptions[ttlIndex].value);  //w minutach
  const [noteType, setNoteType] = useState(initialNoteType);
  const [drawings, setDrawings] = useState([]);
  const [tool, setTool] = useState(Tools.Pencil);
  const [lineWidth, setLineWidth] = useState(3);
  const [content, setContent] = useState(note && note.content ? {code: `

-- response to: 
> ` + note.content} : {code: message ? message : ''});
  const [password, setPassword] = useState(note && note.password ? note.password : addPassword ? addPassword : '');
  const [isLoading, setIsLoading] = useState(false);

  let sketch;

  let translatedTtlOptions = [];

  ttlOptions.forEach((item) => {
    translatedTtlOptions.push({value: item.value, label: t(item.label)});
  });

  let translatedTypeOptions = [];

  typeOptions.forEach((item) => {
    translatedTypeOptions.push({value: item.value, label: t(item.label)});
  });

  function validateForm() {
    return content.code.length > 0;
  }

  function createCommonNote(withPassword = false) {
    const result = {
      userId: storedUserId,
      type: noteType,
      ttl: parseInt(ttl),
      telomer: parseInt(telomer),
      content: content.code,
    };

    if (withPassword) {
      result.password = password;
    }

    return result;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsLoading(true);

    console.log(content.code);

    let contentToSave;

    if(img) {
      contentToSave = JSON.stringify(sketch.toJSON());
    } else {
      contentToSave = content.code;
    };

    const msgSize = contentToSave.length;
    const secret = await standarizePassword(storedUserId, password);

    try {
      const { ciphertext, iv, tag, compression } = encrypt(contentToSave, secret);

      let autopass = false;

      if (typeof addPasswordToUrl === "boolean" && addPasswordToUrl){
        autopass = addPasswordToUrl;
      }

      const newNote = createCommonNote();

      await createNote({
        ...newNote,
        content: ciphertext,
        iv,
        tag,
        compression,
        size: parseInt(msgSize),
        autopass,
      });

      history.push("/");
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  function handleSaveImg(event) {
    handleSubmit(event);
  }

  function createNote(note) {
    return API.post("privatebin", "/privatebin/notes", {
      body: note
    });
  }

  function highlightByType(code) {
    console.log(noteType);

    let shortType = 'plain';

    if (typeof noteType === 'string') {
      const splitted = noteType.split('/');

    let shortType = splitted[1];
    }

    if (shortType === 'plain') {
      shortType = 'html';
    }

    return highlight(code, languages[shortType]);
  }

  return (
    <div className="NewNote">
      <form onSubmit={handleSubmit}>

        <FormGroup>
          <div className="col-sm-6 col-lg-6 col-sm-12">

            <ControlLabel>{t("Maximum number of views")}</ControlLabel>
            <FormControl controlId="telomer"
                         type="number"
                         value={telomer}
                         onChange={e => setTelomer(e.target.value)}
            />
          </div>
            <div className="col-sm-6 col-lg-6 col-sm-12">
              <ControlLabel>{t("Message Type")}</ControlLabel>
              {!img ? (
                <Select
                  controlId="type"
                  options={translatedTypeOptions}
                  defaultValue={translatedTypeOptions[noteTypeIndex]}
                  onChange={e => setNoteType(e.value)}
                />
              ): (<FormControl type='text' readOnly={true} value={noteType} />) }
            </div>
        </FormGroup>

        <FormGroup controlId="ttl">
          <div className="col-sm-6 col-lg-6 col-sm-12">

            <ControlLabel>{t("Expiration date")}</ControlLabel>
              <Select
                options={translatedTtlOptions}
                defaultValue={translatedTtlOptions[ttlIndex]}
                onChange={e => setTtl(e.value)}
                 />
          </div>

           <div className="col-sm-6 col-lg-6 col-sm-12">
              <ControlLabel>{t("Expiration date")} {t("(in minutes)")}</ControlLabel>
              <FormControl controlId="ttl"
                           type="number"
                           value={ttl}
                           onChange={e => setTtl(e.target.value)}
              />
           </div>
        </FormGroup>

        <FormGroup controlId="password">
          <ControlLabel>{t("Password")}</ControlLabel>
          <PasswordMask inputClassName="form-control"
                        buttonClassName="btn btn-primary btn-password"
                        controlId="password"
                        value={password}
                        placeholder={t("Enter password")}
                        onChange={e => setPassword(e.target.value)}
                        showButtonContent={t("Show")}
                        hideButtonContent={t("Hide")}
                        useVendorStyles="false"
          />
        </FormGroup>
        <FormGroup controlId="content">
        {!img ? (
          <Editor
            value={content.code}
            onValueChange={code => setContent({ code })}
            highlight={code => highlightByType(code)}
            padding={10}
            style={{
              fontFamily: '"Fira code", "Fira Mono", monospace',
            }}
          className="container__editor"
        />
        ) : (<>
          {/*<DrawingBoard />*/}

          {/*<ButtonToolbar aria-label="Toolbar with button groups">*/}
          {/*  <ButtonGroup className="mr-2" aria-label="First group" toggle={true}>*/}
          {/*    <Button onClick={() => setTool(Tools.Pencil)}>pencil</Button>*/}
          {/*    <Button onClick={() => setTool( Tools.Line)}>Line</Button>*/}
          {/*    <Button onClick={() => setTool(Tools.Rectangle)}>Rectangle</Button>*/}
          {/*    <Button onClick={() => setTool(Tools.Circle)}>Circle</Button>*/}
          {/*    <Button onClick={() => setTool(Tools.Select)}>Select</Button>*/}
          {/*    <Button onClick={() => setTool(Tools.Pan)}>Pan</Button>*/}
          {/*  </ButtonGroup>*/}
          {/*  <ButtonGroup className="mr-2" aria-label="Second group">*/}
          {/*    <Button onClick={() => setLineWidth(1)}>1</Button>*/}
          {/*    <Button onClick={() => setLineWidth(2)}>2</Button>*/}
          {/*    <Button onClick={() => setLineWidth(3)}>3</Button>*/}
          {/*    <Button onClick={() => setLineWidth(4)}>4</Button>*/}
          {/*    <Button onClick={() => setLineWidth(5)}>5</Button>*/}
          {/*  </ButtonGroup>*/}
          {/*  <ButtonGroup aria-label="Third group">*/}
          {/*    <Button>8</Button>*/}
          {/*  </ButtonGroup>*/}
          {/*</ButtonToolbar>*/}

            <SketchField width='100%'
                            height='50vw'
                            ref={c => (sketch = c)}
                            tool={tool}
                            lineColor='black'
                            lineWidth={lineWidth}
          />
        </>)}
        </FormGroup>

        { !img ? (
        <LoaderButton
          block
          type="submit"
          bsSize="large"
          bsStyle="primary"
          isLoading={isLoading}
          disabled={!validateForm()}
        >
          {t("Create")}
        </LoaderButton>
        ) : (
          <LoaderButton
            block
            bsSize="large"
            bsStyle="primary"
            isLoading={isLoading}
            onClick={handleSaveImg}
          >
            {t("Create")} - img
          </LoaderButton>
        )}
      </form>
    </div>
  );
}