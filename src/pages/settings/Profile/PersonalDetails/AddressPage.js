import lodashGet from 'lodash/get';
import _ from 'underscore';
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {View} from 'react-native';
import ScreenWrapper from '../../../../components/ScreenWrapper';
import HeaderWithCloseButton from '../../../../components/HeaderWithCloseButton';
import withLocalize, {withLocalizePropTypes} from '../../../../components/withLocalize';
import ROUTES from '../../../../ROUTES';
import Form from '../../../../components/Form';
import ONYXKEYS from '../../../../ONYXKEYS';
import CONST from '../../../../CONST';
import TextInput from '../../../../components/TextInput';
import styles from '../../../../styles/styles';
import Navigation from '../../../../libs/Navigation/Navigation';
import * as PersonalDetails from '../../../../libs/actions/PersonalDetails';
import compose from '../../../../libs/compose';
import AddressSearch from '../../../../components/AddressSearch';
import CountryPicker from '../../../../components/CountryPicker';
import StatePicker from '../../../../components/StatePicker';
import { withOnyx } from 'react-native-onyx';

const propTypes = {
    /* Onyx Props */

    /** User's private personal details */
    privatePersonalDetails: PropTypes.shape({
        /** User's home address */
        address: PropTypes.shape({
            street: PropTypes.string,
            city: PropTypes.string,
            state: PropTypes.string,
            zip: PropTypes.string,
            country: PropTypes.string,
        }),
    }),
    
    ...withLocalizePropTypes,
};

const defaultProps = {
    privatePersonalDetails: {
        address: {
            street: '',
            city: '',
            state: '',
            zip: '',
            country: '',
        },
    },
};

class AddressPage extends Component {
    constructor(props) {
        super(props);

        this.validate = this.validate.bind(this);
        this.updateAddress = this.updateAddress.bind(this);
        this.onCountryUpdate = this.onCountryUpdate.bind(this);
        this.assignEmptyError = this.assignEmptyError.bind(this);

        this.state = {
            isUsaForm: false,
        };
    }

    /**
     * Submit form to update user's first and last legal name
     * @param {Object} values - form input values
     */
    updateAddress(values) {
        PersonalDetails.updateAddress(
            `${values.addressLine1.trim()}\n${values.addressLine2}`.trim(),
            values.city.trim(),
            this.state.isUsaForm ? values.state : values.stateOrProvince,
            values.zipPostCode,
            values.country,
        );
    }

    /**
     * @param {String} newCountry - new country selected in form
     */
    onCountryUpdate(newCountry) {
        if (newCountry === 'USA') {
            this.setState({isUsaForm: true});
        } else {
            this.setState({isUsaForm: false});
        }
    }

    /**
     * @param {Object} values - form input values
     * @returns {Object} - An object containing the errors for each inputID
     */
    validate(values) {
        const errors = {};

        // Assign s
        this.assignEmptyError(errors, values, ['addressLine1', 'city', 'zipPostCode', 'country']);
        // this.assignTooLongError(errors, values, ['addressLine1']);

        // Only check "State" dropdown if Country is USA. Otherwise, validate "State / Province" field
        if (this.state.isUsaForm === 'USA') {
            this.assignEmptyError(errors, values, ['state']);
        } else {
            this.assignEmptyError(errors, values, ['stateOrProvince']);
        }

        return errors;
    }

    /**
     * Checks many fields at a time to see if any are empty. If they are, assigns an error to that field.
     * @param {Object} errors
     * @param {Object} values
     * @param {Array} valueKeys
     */
    assignEmptyError(errors, values, valueKeys) {
        _.each(valueKeys, (key) => {
            if (_.isEmpty(values[key])) {
                errors[key] = this.props.translate('common.error.fieldRequired');
            }
        });
    }

    /**
     * @param {String} street
     * @returns {Object}
     */
    parseAddressStreet(street) {
        return {
            addressLine1: street.split('\n')[0],
            addressLine2: street.split('\n').length > 1 ? street.split('\n')[1] : '',
        }
    }

    render() {
        const privateDetails = this.props.privatePersonalDetails || {};
        const {addressLine1, addressLine2} = this.parseAddressStreet(lodashGet(privateDetails, 'address.street') || '');

        return (
            <ScreenWrapper includeSafeAreaPaddingBottom={false}>
                <HeaderWithCloseButton
                    title={this.props.translate('personalDetailsPages.homeAddress')}
                    shouldShowBackButton
                    onBackButtonPress={() => Navigation.navigate(ROUTES.SETTINGS_PERSONAL_DETAILS)}
                    onCloseButtonPress={() => Navigation.dismissModal(true)}
                />
                <Form
                    style={[styles.flexGrow1, styles.ph5]}
                    formID={ONYXKEYS.FORMS.HOME_ADDRESS_FORM}
                    validate={this.validate}
                    onSubmit={this.updateAddress}
                    submitButtonText={this.props.translate('common.save')}
                    enabledWhenOffline
                >
                    <View style={styles.mb4}>
                        <AddressSearch
                            inputID="addressLine1"
                            label={this.props.translate('common.addressLine', {lineNumber: 1})}
                            defaultValue={addressLine1}
                        />
                    </View>
                    <View style={styles.mb4}>
                        <TextInput
                            inputID="addressLine2"
                            label={this.props.translate('common.addressLine', {lineNumber: 2})}
                            defaultValue={addressLine2}
                            maxLength={CONST.FORM_CHARACTER_LIMIT}
                        />
                    </View>
                    <View style={styles.mb4}>
                        <TextInput
                            inputID="city"
                            label={this.props.translate('common.city')}
                            defaultValue={lodashGet(privateDetails, 'address.city') || ''}
                            maxLength={CONST.FORM_CHARACTER_LIMIT}
                        />
                    </View>
                    <View style={[styles.flexRow, styles.mb4]}>
                        <View style={[styles.flex1, styles.mr2]}>
                            {this.state.isUsaForm ? (
                                <StatePicker
                                    inputID="state"
                                    defaultValue={lodashGet(privateDetails, 'address.state') || ''}
                                />
                            ) : (
                                <TextInput
                                    inputID="stateOrProvince"
                                    label={this.props.translate('common.stateOrProvince')}
                                    defaultValue={lodashGet(privateDetails, 'address.state') || ''}
                                    maxLength={CONST.FORM_CHARACTER_LIMIT}
                                />
                            )}
                        </View>
                        <View style={[styles.flex1]}>
                            <TextInput
                                inputID="zipPostCode"
                                label={this.props.translate('common.zipPostCode')}
                                keyboardType={CONST.KEYBOARD_TYPE.NUMBER_PAD}
                                defaultValue={lodashGet(privateDetails, 'address.zip') || ''}
                                maxLength={CONST.BANK_ACCOUNT.MAX_LENGTH.ZIP_CODE}
                            />
                        </View>
                    </View>
                    <View>
                        <CountryPicker
                            inputID="country"
                            onValueChange={this.onCountryUpdate}
                            defaultValue={lodashGet(privateDetails, 'address.country') || ''}
                        />
                    </View>
                </Form>
            </ScreenWrapper>
        );
    }
}

AddressPage.propTypes = propTypes;
AddressPage.defaultProps = defaultProps;

export default compose(
    withLocalize,
    withOnyx({
        privatePersonalDetails: {
            key: ONYXKEYS.PRIVATE_PERSONAL_DETAILS,
        },
    }),
)(AddressPage);
