import React from 'react';
import { Text, styled, Button, FlexColumn, FlipperPlugin, DetailSidebar, SearchableTable } from 'flipper';
import { COLUMNS, COLUMN_SIZE } from './config';
import SideBar from './components/SideBar';
import { getDataWithID, formatEvent } from './utils/functions';

const MainContainer = styled.div({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

const ActionsContainer = styled.div({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  flex: 1,
});

interface PersistedState {
  events: Array<Row>;
}

interface State {
  selectedIds: Array<number>;
  selectedData: Row | null;
}

interface Row {
  id: number;
  level: string;
  service: string;
  scope: string;
  eventName: string;
  message: string;
  data: Record<string, any>;
  error?: string;
  time: string;
}

const formatData = (data: Record<string, any>) => {
  if (!data) {
    return null;
  }
  return (
    <React.Fragment>
      {Object.entries(data).map(([ok, ov]) => (
        <Text>
          {ok} <Text style={{ color: 'red' }}>=</Text> {ov}
        </Text>
      ))}
    </React.Fragment>
  );
};

export default class extends FlipperPlugin<State, never, PersistedState> {
  id = 'flipper-plugin-interlogger';

  constructor(props: any) {
    super(props);
    this.state = {
      selectedIds: [],
      selectedData: null,
    };
    this.handleClear = this.handleClear.bind(this);
    this.handleRowHighlighted = this.handleRowHighlighted.bind(this);
  }

  static defaultPersistedState = {
    events: [],
  };

  static persistedStateReducer(persistedState: PersistedState, method: string, data: Row): PersistedState {
    try {
      switch (method) {
        case 'action': {
          let lastPersistedActions = persistedState.events;
          if (!lastPersistedActions) {
            lastPersistedActions = [];
          }
          return {
            events: [...lastPersistedActions, getDataWithID(lastPersistedActions, data)],
          };
        }
        default:
          return persistedState;
      }
    } catch (err) {
      return persistedState;
    }
  }

  handleClear() {
    const { setPersistedState } = this.props;
    this.setState({ selectedIds: [] });
    setPersistedState({ events: [] });
  }

  handleRowHighlighted(keys: Array<any>) {
    const { persistedState } = this.props as { persistedState: PersistedState };
    const { selectedIds } = this.state;

    const selectedId = keys.length !== 1 ? null : keys[0];
    if (selectedIds.includes(selectedId) || !persistedState.events) {
      return this.setState({
        selectedIds: [],
      });
    }
    const selectedData: Row | undefined = persistedState.events.find((v: any) => v.id === selectedId);

    if (selectedData) {
      this.setState({
        selectedIds: [selectedId],
        selectedData,
      });
    }
  }

  renderSidebar() {
    const { selectedIds, selectedData } = this.state;
    const selectedId = selectedIds[0];
    if (!selectedData || !selectedId) {
      return null;
    }
    return <SideBar {...selectedData} />;
  }

  buildRow(row: Row) {
    return {
      columns: {
        level: {
          value: <Text>{row.level}️</Text>,
          filterValue: row.level,
        },
        scope: {
          value: <Text>{row.scope}️</Text>,
          filterValue: row.scope,
        },
        eventName: {
          value: <Text>{formatEvent(row.eventName)}</Text>,
          filterValue: row.eventName,
        },
        message: {
          value: <Text>{row.message}</Text>,
          filterValue: row.message,
        },
        data: {
          value: <Text>{formatData(row.data)}️</Text>,
          filterValue: row.data,
        },
      },
      key: row.id,
      copyText: JSON.stringify(row, null, 2),
      filterValue: `${row.service} ${row.eventName}`,
    };
  }

  render() {
    const { persistedState = {} } = this.props;
    const { events = [] } = persistedState as PersistedState;
    const rows = events.map(this.buildRow);

    return (
      <FlexColumn grow>
        <MainContainer>
          <Text style={{ fontSize: 17, padding: 5, paddingLeft: 10, paddingRight: 10, fontWeight: 'bold' }}>
            🔔 Events
          </Text>
          <ActionsContainer>
            <SearchableTable
              key={this.id}
              rowLineHeight={30}
              floating={false}
              multiline
              columnSizes={COLUMN_SIZE}
              columns={COLUMNS}
              onRowHighlighted={this.handleRowHighlighted}
              multiHighlight
              rows={rows}
              stickyBottom
              actions={
                <>
                  <Button onClick={this.handleClear}>🧹 Clear events</Button>
                </>
              }
            />
          </ActionsContainer>
        </MainContainer>
        <DetailSidebar>{this.renderSidebar()}</DetailSidebar>
      </FlexColumn>
    );
  }
}
