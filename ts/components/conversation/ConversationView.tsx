// Copyright 2020 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { useEscapeHandling } from '../../hooks/useEscapeHandling';
import { compressAndEncodeMessage } from '../../messages/encodeMessage';
import { secretMessageStatus, SENDING_SECRET_SIGNAL, STOPPING_SECRET_SIGNAL } from '../../services/SecretMessageService';

export type PropsType = {
  conversationId: string;
  hasOpenModal: boolean;
  hasOpenPanel: boolean;
  isSelectMode: boolean;
  onExitSelectMode: () => void;
  processAttachments: (options: {
    conversationId: string;
    files: ReadonlyArray<File>;
  }) => void;
  renderCompositionArea: (
    conversationId: string,
    encodedMessage: number[],
    setEncodedMessage: (arg0: number[]) => void,
    isSendingSecretMessage: boolean,
    setIsSendingSecretMessage: (arg0: boolean) => void
  ) => JSX.Element;
  renderConversationHeader: (
    conversationId: string,
    showSecretView: boolean,
    setShowSecretView: (arg0: boolean) => void
  ) => JSX.Element;
  renderTimeline: (conversationId: string) => JSX.Element;
  renderPanel: (conversationId: string) => JSX.Element | undefined;
  shouldHideConversationView?: boolean;
};

export function ConversationView({
  conversationId,
  hasOpenModal,
  hasOpenPanel,
  isSelectMode,
  onExitSelectMode,
  processAttachments,
  renderCompositionArea,
  renderConversationHeader,
  renderTimeline,
  renderPanel,
  shouldHideConversationView,
}: PropsType): JSX.Element {
  const onDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.stopPropagation();
      event.preventDefault();

      if (!event.dataTransfer) {
        return;
      }

      if (event.dataTransfer.types[0] !== 'Files') {
        return;
      }

      const { files } = event.dataTransfer;
      processAttachments({
        conversationId,
        files: Array.from(files),
      });
    },
    [conversationId, processAttachments]
  );

  const onPaste = React.useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      if (hasOpenModal || hasOpenPanel) {
        return;
      }

      if (!event.clipboardData) {
        return;
      }
      const { items } = event.clipboardData;

      const fileItems = [...items].filter(item => item.kind === 'file');
      if (fileItems.length === 0) {
        return;
      }

      const allVisual = fileItems.every(item => {
        const type = item.type.split('/')[0];
        return type === 'image' || type === 'video';
      });
      if (allVisual) {
        const files: Array<File> = [];
        for (let i = 0; i < items.length; i += 1) {
          const file = items[i].getAsFile();
          if (file) {
            files.push(file);
          }
        }

        processAttachments({
          conversationId,
          files,
        });

        event.stopPropagation();
        event.preventDefault();

        return;
      }

      const firstAttachment = fileItems[0]?.getAsFile();
      if (firstAttachment) {
        processAttachments({
          conversationId,
          files: [firstAttachment],
        });

        event.stopPropagation();
        event.preventDefault();
      }
    },
    [conversationId, processAttachments, hasOpenModal, hasOpenPanel]
  );

  useEscapeHandling(
    isSelectMode && !hasOpenModal ? onExitSelectMode : undefined
  );

  type SecretMessage = [string, boolean];
  // Store secret messages
  const [messages, setMessages] = useState<SecretMessage[]>([]);
  const [isSendingSecretMessage, setIsSendingSecretMessage] =
    React.useState<boolean>(false);

  const [encodedMessage, setEncodedMessage] = React.useState<number[]>([]);

  function SecretMessageInput() {
    const [text, setText] = useState('');

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setText(event.target.value);
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        if (isSendingSecretMessage) {
          alert(
            `You must finish sending cover messages before sending another secret`
          );
          return;
        }

        if (secretMessageStatus.isSendingSecret) {
          alert(
            'Secret message currently being sent. Please wait until it completes'
          );
          return;
        }

        console.log('User pressed Enter with text: ', text);

        const newMessage: SecretMessage = [text, true];
        setMessages(prevMessages => [...prevMessages, newMessage]);
        setText('');
        setIsSendingSecretMessage(true);
        setEncodedMessage([SENDING_SECRET_SIGNAL, ...compressAndEncodeMessage(text), STOPPING_SECRET_SIGNAL]);
        console.log(
          'Secret message: need to send ',
          encodedMessage.length,
          ' messages'
        );
      }
    };

    return (
      <div
        className="text-input-container"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '20px',
        }}
      >
        <input
          className="rounded-input"
          style={{
            border: '0px solid #ccc', // Ensure proper quotation
            borderRadius: '25px',
            padding: '8px 16px',
            outline: 'none',
            backgroundColor: '#444',
          }}
          type="text"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          placeholder="Secret message"
        />
      </div>
    );
  }

  // Format for outgoing messages
  function OutgoingMessage(text: string): JSX.Element {
    return (
      <div className={`module-message module-message--outgoing`}>
        <div className="module-message__container-outer">
          <div
            className={`module-message__container module-message__container--outgoing module-message__container--outgoing-ultramarine`}
          >
            <div
              dir="auto"
              className={`module-message__text module-message__text--outgoing`}
            >
              <span>{text}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format for incoming messages
  function IncomingMessage(text: string): JSX.Element {
    return (
      <div className={`module-message module-message--incoming`}>
        <div className="module-message__container-outer">
          <div
            className={`module-message__container module-message__container--incoming`}
          >
            <div
              dir="auto"
              className={`module-message__text module-message__text--incoming`}
            >
              <span>{text}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [showSecretView, setShowSecretView] = useState(false);

  useEffect(() => {
    // When secret message fully received, display
    const handleSecretMessageDecoded = (
      event: CustomEvent<{ secretMessage: string }>
    ) => {
      const { secretMessage } = event.detail;
      const newMessage: SecretMessage = [secretMessage, false];
      console.log('Secret messages: ', newMessage);
      setMessages(prevMessages => [...prevMessages, newMessage]);
    };

    // Register
    window.addEventListener(
      'secretMessageDecoded',
      handleSecretMessageDecoded as EventListener
    );

    // Cleanup
    return () => {
      window.removeEventListener(
        'secretMessageDecoded',
        handleSecretMessageDecoded as EventListener
      );
    };
  }, []);

  return (
    <div
      className="ConversationView ConversationPanel"
      onDrop={onDrop}
      onPaste={onPaste}
    >
      <div
        className={classNames('ConversationPanel', {
          ConversationPanel__hidden: shouldHideConversationView,
        })}
      >
        <div className="ConversationView__header">
          {renderConversationHeader(
            conversationId,
            showSecretView,
            setShowSecretView
          )}
        </div>
        <div className="ConversationView__pane">
          <div className="ConversationView__timeline--container">
            <div aria-live="polite" className="ConversationView__timeline">
              {renderTimeline(conversationId)}
            </div>
          </div>
          <div className="ConversationView__composition-area">
            {renderCompositionArea(
              conversationId,
              encodedMessage,
              setEncodedMessage,
              isSendingSecretMessage,
              setIsSendingSecretMessage
            )}
          </div>

          {showSecretView && (
            <div className="ConversationView__timeline--container">
              <div aria-live="polite" className="ConversationView__timeline">
                {/* {renderTimeline(conversationId)} */}
                {messages.map(secretMessage => {
                  const [text, isOutgoing] = secretMessage;
                  return isOutgoing
                    ? OutgoingMessage(text)
                    : IncomingMessage(text);
                })}
              </div>
            </div>
          )}
          {showSecretView && (
            <div>
              {isSendingSecretMessage && (
                <h3>Please send {encodedMessage.length} cover messages</h3>
              )}
              <SecretMessageInput />
            </div>
          )}
        </div>
      </div>
      {renderPanel(conversationId)}
    </div>
  );
}
