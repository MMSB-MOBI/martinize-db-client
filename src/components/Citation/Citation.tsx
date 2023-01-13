import React from 'react';
import { Container, Typography, TextField, makeStyles, Button } from '@material-ui/core';
import { Marger, notifyError, setPageTitle } from '../../helpers';

const useStyles = makeStyles(theme => ({
    text: {
        width: '100%',
    },
    passwordContainer: {
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px',
        [theme.breakpoints.down("sm")]: {
            gridTemplateColumns: '1fr',
        },
    },
    password: {
        width: '100%',
    },
}));

export default function CitationPage() {


    React.useEffect(() => {
        setPageTitle("Contact");
    }, []);



    return (
        <Container style={{ paddingTop: 14 }}>
            <Typography variant="h3" className="page-title">
                Citation
            </Typography>

            <Typography align="center">
                How to cite MAD feature.
            </Typography>

            <Marger size="1rem" />



            <Typography variant="h4">Tools citations
            </Typography>

            <ul>
                <li>
                    <Typography variant="h5">
                        If you are using MAD database, molecule builder and system builder:</Typography>
                    <Typography variant="body2">Hilpert,
                        C., Beranger, L., Souza, P.C.T., Vainikka, P.A., Nieto, V., Marrink,
                        S.J., Monticelli, L.&; Launay, G. (2022) Facilitating CG
                        simulations with MAD: the MArtini Database Server.  BiorXiv.
                        http://dx.doi.org/10.1101/2022.08.03.502585.</Typography>
                </li>
                <Marger size="1rem" />
                <li>
                    <Typography variant="h5">
                        If you are using molecule builder:</Typography>
                    <Typography variant="body2">	Kroon, P. C.,
                        Grunewald, F.; Barnoud, J.,
                        Souza, P.C.T. , Wassenaar, T.A., Marrink, S.J.Martinize2 and
                        Vermouth: Unified Framework for Topology Generation.to be submitted</Typography>
                </li>
                <Marger size="1rem" />
                <li>
                    <Typography variant="h5">
                        If you are using system builder:</Typography>
                    <Typography variant="body2">	Wassenaar,
                        T.A., Ingólfsson, H.I., Böckmann, R.A., Tieleman, D.P.&;
                        Marrink, S.J. (2015) 	Computational lipidomics with insane: A
                        versatile tool for generating custom membranes for 	molecular
                        simulations. Journal of chemical theory and computation 11,
                        2144–2155.</Typography>
                </li>
                <Marger size="1rem" />
                <li>
                    <Typography variant="h5">
                        If you are using polymer builder:</Typography>
                    <Typography variant="body1">

                        Grünewald, F., Alessandri, R., Kroon, P.C. et al. Polyply; a python suite for facilitating simulations of macromolecules and nanomaterials. Nat Commun 13, 68 (2022).
                    </Typography>
                    <Typography variant="body1">future
                        reference from Romuald.</Typography>
                </li>
                <Marger size="1rem" />


            </ul>



            <Typography variant="h4">
                Force-field citations </Typography>

            <Marger size="1rem" />

            <ul>
                <li>

                    <Typography variant="h5">
                        If you are using/generating a model with Martini 2 force-field:</Typography>
                    <Typography variant="body2">Marrink,
                        S.J., Risselada, H.J., Yefimov, S., Tieleman, D.P.&; De Vries,
                        A.H. (2007) The MARTINI force field: Coarse grained model for
                        biomolecular simulations. The journal of physical chemistry. B 111,
                        7812–7824.</Typography>

                    <ul>

                        <li>

                            <Typography variant="h5">
                                If you are using Protein models:</Typography>
                            <ul>
                                <li>
                                    <Typography variant="h5"> for Martini 2.1:
                                    </Typography>
                                    <Typography variant="body2">		Monticelli,
                                        L., Kandasamy, S.K., Periole, X., Larson, R.G., Tieleman, D.P.&;
                                        Marrink, S.J. (2008) The MARTINI coarse-grained force field:
                                        Extension to proteins. 		Journal of chemical theory and computation
                                        4, 819–834.</Typography>
                                </li>
                                <li>
                                    <Typography variant="h5"> for Martini 2.2:
                                    </Typography>
                                    <Typography variant="body2">		De
                                        Jong, D.H., Singh, G., Bennett, W.F.D., Arnarez, C., Wassenaar, T.A.,
                                        Schäfer, 		L.V., Periole, X., Tieleman, D.P.&; Marrink, S.J.
                                        (2013) Improved parameters for the 		martini coarse-grained protein
                                        force field. Journal of chemical theory and 			computation 9, 687–697</Typography>
                                </li>

                            </ul>
                        </li>
                        <Marger size="1rem" />
                        <li>
                            <Typography variant="h5">
                                If you have a bias on top of protein models:</Typography>
                            <ul>
                                <li>

                                    <Typography variant="h5">
                                        if you are using a protein model with Elastic Network:</Typography>
                                    <Typography variant="body2">		Periole,
                                        X., Cavalli, M., Marrink, S.J.&; Ceruso, M.A. (2009) Combining an
                                        Elastic 		Network With a Coarse-Grained Molecular Force Field:
                                        Structure, Dynamics, and 		Intermolecular Recognition. Journal of
                                        chemical theory and computation 5, 2531–		2543.</Typography>
                                </li>

                                <li>
                                    <Typography variant="h5">
                                        if you are using a protein model with Go model:</Typography>
                                    <Typography variant="body2">		Poma,
                                        A.B., Cieplak, M.&; Theodorakis, P.E. (2017) Combining the
                                        MARTINI and 		Structure-Based Coarse-Grained Approaches for the
                                        Molecular Dynamics Studies of 		Conformational Transitions in
                                        Proteins. Journal of chemical theory and computation 		13, 1366–1374.</Typography>
                                </li>
                                <li>

                                    <Typography variant="h5">
                                        if you are using a protein model and side-chain corrections:</Typography>
                                    <Typography variant="body2">		Herzog,
                                        F. A., Braun, L., Schoen, I., and Vogel, V. (2016) Improved Side
                                        Chain 			Dynamics in MARTINI Simulations of Protein–Lipid
                                        Interfaces. Journal of chemical 		theory and computation, 12,
                                        2446–2458.</Typography>
                                </li>
                            </ul>

                            <Marger size="1rem" />
                            <Typography variant="h5">
                                If you are using other Martini 2 models from the database:</Typography>

                            <ul>
                                <li>
                                    <Typography variant="body1">
                                        look the reference in the page of the molecule or their itp files.</Typography>

                                </li>
                            </ul>

                        </li>


                        <Marger size="1rem" />
                    </ul>
                </li>
                <li>
                    <Typography variant="h5">
                        If you are using/generating a model with Martini 3 force-field:</Typography>

                    <Typography variant="body2">Souza,
                        P.C.T., Alessandri, R., Barnoud, J., Thallmair, S., Faustino, I.,
                        Grünewald, F., Patmanidis, I., Abdizadeh, H., Bruininks, B. M. H.,
                        Wassenaar, T. A., Kroon, P. C., Melcr, J., Nieto, V., Corradi, V.,
                        Khan, H. M. et al.(2021) Martini 3: a general purpose force field for
                        coarse-grained molecular dynamics Nature methods, 18, 382.
                    </Typography>
                    <Marger size="1rem" />
                    <ul>

                        <li>
                            <Typography variant="h5">
                                If you are using Protein models:</Typography>
                            <Typography variant="body2">	Souza, P.C.T.,Alessandri, R., Barnoud, J., Thallmair, S., Faustino, I., Grünewald,
                                F., 	Patmanidis, I., Abdizadeh, H., Bruininks, B. M. H., Wassenaar,
                                T. A., Kroon, P. C., Melcr, J., 	Nieto, V., Corradi, V., Khan, H. M.
                                et al.(2021) Martini 3: a general purpose force field for coarse-grained mlecular dynamics Nature methods, 18, 382.
                            </Typography>
                        </li>
                        <Marger size="1rem" />
                        <li>
                            <Typography variant="h5">
                                If you have a bias on top of protein models:</Typography>
                            <ul>
                                <li>
                                    <Typography variant="h5"> if you are using a protein model with Elastic Network:</Typography>
                                    <Typography variant="body2">		Periole,
                                        X., Cavalli, M., Marrink, S.J.&; Ceruso, M.A. (2009) Combining an
                                        Elastic 		Network With a Coarse-Grained Molecular Force Field:
                                        Structure, Dynamics, and 		Intermolecular Recognition. Journal of
                                        chemical theory and computation 5, 2531–		2543.</Typography>

                                </li>
                                <li>
                                    <Typography variant="h5">
                                        if you are using a protein model with Go model:</Typography>
                                    <Typography variant="body2">		Poma,
                                        A.B., Cieplak, M.&; Theodorakis, P.E. (2017) Combining the
                                        MARTINI and 		Structure-Based Coarse-Grained Approaches for the
                                        Molecular Dynamics Studies of 		Conformational Transitions in
                                        Proteins. Journal of chemical theory and computation 		13, 1366–1374.</Typography>
                                </li>
                                <li>
                                    <Typography variant="h5">
                                        if you are using a protein model and side-chain corrections:</Typography>
                                    <Typography variant="body2">		Herzog,
                                        F. A., Braun, L., Schoen, I., and Vogel, V. (2016) Improved Side
                                        Chain 			Dynamics in MARTINI Simulations of Protein–Lipid
                                        Interfaces. Journal of chemical 		theory and computation, 12,
                                        2446–2458.</Typography>
                                </li>
                            </ul>
                            <Marger size="1rem" />
                            <li>
                                <Typography variant="h5">
                                    If you are using other Martini 2 models from the database:</Typography>
                                <Typography variant="body1">	-
                                    look the reference in the page of the molecule or their itp files.</Typography><Typography variant="body1"><br />

                                </Typography>
                            </li>

                        </li>


                    </ul >
                </li>
            </ul>

        </Container >
    );
}
