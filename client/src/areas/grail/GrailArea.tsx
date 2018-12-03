import * as React from "react";
import TabRenderer from "./tabRenderer/TabRenderer";
import SearchBox from "./searchBox/SearchBox";
import { GrailManager, IGrailError } from "./GrailManager";
import { CircularProgress, createStyles, Divider, Theme, withStyles, WithStyles } from "@material-ui/core";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { ILoginInfo } from "../home/loginForm/LoginForm";
import SaveGrailToServerComponent from "./dataManipulation/clickable-components/SaveGrailToServerComponent";
import { IHolyGrailData } from "../../common/definitions/union/IHolyGrailData";
import HomeButton from "./homeButton/HomeButton";
import MenuButton from "./menu/MenuButton";
import ExportListItem from "./dataManipulation/clickable-components/ExportListItem";
import ImportListItem from "./dataManipulation/clickable-components/ImportListItem";
import ToggleAllListItem from "./dataManipulation/clickable-components/ToggleAllListItem";
import DiscardChangesComponent from "./dataManipulation/clickable-components/DiscardChangesComponent";
import ListItemWithProgress from "../../common/components/ListItemWithProgress";
import { SettingsListItem } from "./dataManipulation/clickable-components/SettingsListItem";
import VersionNotifier from "./VersionNotifier";
import { GrailTypeToggler } from "./dataManipulation/clickable-components/GrailTypeToggler";
import { IPassDownAppProps } from "../../App";
import { GrailErrorHandler } from "./GrailErrorHandler";
import { GrailMode } from "./GrailMode";
import { AllBusinessGrailsType } from "../../common/definitions/business/AllBusinessGrailsType";

export interface IGrailAreaState {
  searchResult?: Partial<IHolyGrailData>;
  data?: AllBusinessGrailsType;
  error?: IGrailError;
  loading?: boolean;
}

const styles = (theme: Theme) =>
  createStyles({
    tabs: {
      marginTop: theme.spacing.unit * 4
    },
    searchContainer: {
      maxWidth: 700,
      margin: "auto",
      textAlign: "center"
    },
    rightButtonsContainer: {
      position: "fixed",
      right: theme.spacing.unit,
      bottom: theme.spacing.unit
    },
    leftButtonsContainer: {
      position: "fixed",
      left: theme.spacing.unit,
      bottom: theme.spacing.unit
    },
    buttonRow: {
      display: "flex",
      justifyContent: "flex-end"
    },
    loader: {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)"
    }
  });

export interface IGrailAreaRouterParams {
  address: string;
  grailMode: string;
}

type Props = IPassDownAppProps & WithStyles<typeof styles> & RouteComponentProps<IGrailAreaRouterParams>;

class GrailArea extends React.Component<Props, IGrailAreaState> {
  public constructor(props: Props) {
    super(props);
    this.state = { loading: true };
  }

  public static getDerivedStateFromProps(props: Props, state: IGrailAreaState) {
    const newMode = GrailArea.getGrailModeFromRouteParams(props);
    if (GrailManager.current && GrailManager.current.grailMode !== newMode) {
      state.loading = true;
      state.data = null;
      state.searchResult = null;
      GrailManager.current.setGrailMode(newMode);
      props.onGrailModeChange(newMode);
    }

    return state;
  }

  public componentDidMount() {
    const loginInfo = (this.props.location.state || {}) as ILoginInfo;
    const address = loginInfo.address || this.props.match.params.address;
    const grailMode = GrailArea.getGrailModeFromRouteParams(this.props);
    this.props.onGrailModeChange(grailMode);
    const dataManager = GrailManager.createInstance(grailMode, address, loginInfo.password, loginInfo.keepLoggedIn);
    dataManager.initialize().subscribe(
      () => this.setState({ data: dataManager.grail, loading: false }),
      // todo: if we have local storage data, and an error occurs, only show a warning instead of an error
      // so you can also use the app offline
      (err: IGrailError) => this.setState({ error: err })
    );
  }

  private static getGrailModeFromRouteParams(props: Props) {
    switch (props.match.params.grailMode as GrailMode) {
      case GrailMode.Eth:
        return GrailMode.Eth;
      case GrailMode.Runeword:
        return GrailMode.Runeword;
      default:
        return GrailMode.Holy;
    }
  }

  public render() {
    if (this.state.error) {
      return <GrailErrorHandler error={this.state.error} />;
    }

    if (this.state.loading) {
      return (
        <div className={this.props.classes.loader}>
          <CircularProgress size={100} />
        </div>
      );
    }

    if (!this.state.data) {
      return null;
    }
    return (
      <div>
        <VersionNotifier />
        <div className={this.props.classes.searchContainer}>
          <SearchBox data={this.state.data} onSearchResult={this.onSearchResult} />
        </div>
        <div className={this.props.classes.tabs}>
          <TabRenderer allData={this.state.data} searchData={this.state.searchResult} />
        </div>

        <div className={this.props.classes.leftButtonsContainer}>
          <HomeButton />
        </div>

        <div className={this.props.classes.rightButtonsContainer}>
          <div className={this.props.classes.buttonRow}>
            <SaveGrailToServerComponent registerShortCut={true} />
          </div>
          <div className={this.props.classes.buttonRow}>
            <DiscardChangesComponent />
          </div>
          <div className={this.props.classes.buttonRow}>
            <GrailTypeToggler grailMode={GrailManager.current.grailMode} />
          </div>
          <div className={this.props.classes.buttonRow}>
            <MenuButton>
              <ListItemWithProgress
                primaryText={GrailManager.current.address}
                secondaryText={GrailManager.current.isReadOnly ? "Read-only" : null}
                firstIcon="person"
              />
              <Divider />
              <SaveGrailToServerComponent renderAsListItem={true} />
              <DiscardChangesComponent renderAsListItem={true} />
              <ToggleAllListItem onToggle={d => this.setState({ data: d })} />
              <ImportListItem />
              <ExportListItem />
              <GrailTypeToggler renderAsListItem={true} grailMode={GrailManager.current.grailMode} />
              <SettingsListItem onSettingsChanged={() => this.setState({ data: GrailManager.current.grail })} />
            </MenuButton>
          </div>
        </div>
      </div>
    );
  }

  private onSearchResult = (result: Partial<IHolyGrailData>) => {
    this.setState({ searchResult: result });
  };
}

export default withRouter(withStyles(styles)(GrailArea));
