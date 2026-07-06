import CardPage from './CardPage';
import { useTrackView } from '../hooks/useTrackView';

function DowryCal() {

    useTrackView("DowryCal");

    return (
        <CardPage
            title="Dowry Calculator"
            subtitle="View calculation details, saved values, and related report information."
        />
    );
}

export default DowryCal;
