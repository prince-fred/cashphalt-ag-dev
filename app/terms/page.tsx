import { Card } from '@/components/ui/Card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-concrete-grey flex flex-col items-center p-4 md:p-8">
            <div className="w-full max-w-4xl">
                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center text-matte-black hover:text-signal-yellow transition-colors font-bold uppercase tracking-wider text-sm">
                        <ArrowLeft size={16} className="mr-2" /> Back to Home
                    </Link>
                </div>

                <div className="bg-matte-black text-white p-8 rounded-t-2xl relative overflow-hidden border-b-4 border-signal-yellow">
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Terms and Conditions</h1>
                        <p className="text-gray-400">Effective Date: February 11, 2026</p>
                    </div>
                    {/* Background Texture */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                </div>

                <Card className="rounded-t-none border-t-0 shadow-xl p-8 prose prose-slate max-w-none">
                    <h3>1. INTRODUCTION AND ACCEPTANCE</h3>
                    <p>
                        Welcome to Cashphalt Parking Solutions, LLC ("Cashphalt," "we," "us," or "our"). These Terms and Conditions ("Terms") govern your access to and use of our parking payment and software solutions, including our mobile application, website, and related services (collectively, the "Platform" or "Services"). By creating an account, installing our application, or using our Services in any manner, you agree to be legally bound by these Terms.
                    </p>
                    <p className="font-bold"> PLEASE READ THESE TERMS CAREFULLY. IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE OUR SERVICES.</p>

                    <h3>2. SERVICE OVERVIEW</h3>
                    <p>
                        Cashphalt provides a technology platform that enables digital parking payment processing, permit management, and related parking services. We act as a software service provider facilitating transactions between users and parking operators, property owners, and parking management companies ("Parking Operators"). Cashphalt does not own, operate, or manage parking facilities and is not responsible for the day-to-day operations of parking locations. We facilitate payment processing through third-party payment processors but do not directly process credit card payments ourselves.
                    </p>

                    <h3>3. ACCOUNT REGISTRATION AND ELIGIBILITY</h3>
                    <ol>
                        <li>You must be at least 18 years of age and legally capable of entering into binding contracts to use our Services.</li>
                        <li>You agree to provide accurate, current, and complete information during registration and to update such information to maintain its accuracy.</li>
                        <li>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</li>
                        <li>You must notify us immediately of any unauthorized access to or use of your account.</li>
                        <li>Each user may maintain only one account. Multiple accounts for the same individual are prohibited.</li>
                    </ol>

                    <h3>4. USER OBLIGATIONS AND RESTRICTIONS</h3>
                    <h4>4.1 Permitted Use</h4>
                    <p>You may use the Platform solely for lawful purposes and in accordance with these Terms. You agree to use the Services only for personal, non-commercial parking payment transactions unless expressly authorized by Cashphalt in writing.</p>

                    <h4>4.2 Prohibited Activities</h4>
                    <p>You agree NOT to:</p>
                    <ul>
                        <li>Use the Platform for any illegal purpose or in violation of any local, state, national, or international law;</li>
                        <li>Violate or infringe upon the intellectual property rights of Cashphalt or any third party;</li>
                        <li>Transmit any viruses, malware, or other harmful code;</li>
                        <li>Attempt to gain unauthorized access to any portion of the Platform or any systems or networks connected to the Platform;</li>
                        <li>Use any robot, spider, scraper, or other automated means to access the Platform;</li>
                        <li>Interfere with or disrupt the Platform or servers or networks connected to the Platform;</li>
                        <li>Impersonate any person or entity or falsely state or misrepresent your affiliation with any person or entity;</li>
                        <li>Modify, adapt, translate, reverse engineer, decompile, or disassemble any portion of the Platform;</li>
                        <li>Remove any copyright, trademark, or other proprietary rights notices from the Platform;</li>
                        <li>Collect or store personal data about other users without their express consent.</li>
                    </ul>

                    <h3>5. PARKING TRANSACTIONS AND PAYMENTS</h3>
                    <h4>5.1 Third-Party Payment Processing</h4>
                    <p>We use Stripe, Inc. ("Stripe") and potentially other third-party payment processors to process all payment transactions. When you provide payment information, it is transmitted directly to and stored by our payment processor in accordance with their terms of service and privacy policy. We do not store your complete credit card information on our servers. By using the Platform, you agree to be bound by Stripe's Services Agreement (available at <a href="https://stripe.com/legal" target="_blank" rel="noopener noreferrer">https://stripe.com/legal</a>) and any other applicable payment processor terms, as the same may be modified by Stripe or such processor from time to time.</p>

                    <h4>5.2 Payment Authorization</h4>
                    <p>By providing payment information, you authorize Cashphalt to initiate charges through our third-party payment processor for all parking fees, permits, citations, penalties, service fees, and any other charges incurred through your use of the Services. You represent and warrant that you have the legal right to use any payment method you provide. While we use third-party processors to handle payment transactions, you acknowledge that Cashphalt is responsible for determining refund eligibility, managing your account, and facilitating the overall transaction process.</p>

                    <h4>5.3 Accuracy of Information</h4>
                    <p>You are solely responsible for entering accurate vehicle information, license plate numbers, parking location details, time selections, and all other transaction information. Cashphalt is not liable for any penalties, fines, or charges resulting from incorrect information you provide. The use of a third-party payment processor does not relieve you of responsibility for ensuring transaction accuracy.</p>

                    <h4>5.4 No Refunds Policy</h4>
                    <p><strong>ALL SALES ARE FINAL.</strong> No refunds will be provided for: (a) incorrect license plate entries; (b) duplicate parking transactions; (c) unused parking time; (d) early termination of parking sessions or permits; (e) user error in entering information; (f) technical issues with your device or internet connection; (g) failure to properly activate or deactivate a parking session; or (h) any other reason except as required by applicable law. You acknowledge that you are responsible for verifying all transaction details before confirmation. While Stripe or other payment processors handle the technical processing of payments, Cashphalt maintains sole discretion over refund decisions and policies.</p>

                    <h4>5.5 Chargebacks and Payment Disputes</h4>
                    <p>If you initiate a chargeback or payment dispute with your financial institution or payment card issuer, you agree to cooperate with us and our payment processor to resolve the dispute. You acknowledge that frivolous or unjustified chargebacks may result in immediate termination of your account and potential legal action to recover costs and fees. We reserve the right to charge you for any costs we incur related to chargebacks or payment disputes, including administrative fees and chargeback fees imposed by payment processors.</p>

                    <h4>5.6 Pricing and Rate Changes</h4>
                    <p>Parking rates are set by Parking Operators and may vary by location, time of day, day of week, special events, and other factors beyond our control. Rates displayed on the Platform are provided for informational purposes and may not reflect current pricing. You are solely responsible for determining applicable parking rates before initiating a parking session. We reserve the right to pass through any rate increases or additional fees imposed by Parking Operators.</p>

                    <h4>5.7 Service Fees and Convenience Fees</h4>
                    <p>Cashphalt may charge convenience fees, service fees, or transaction fees for use of the Platform. Any applicable fees will be disclosed prior to transaction completion. You agree to pay all such fees in addition to parking charges. These fees are separate from any fees charged by our payment processors.</p>

                    <h4>5.8 Failed Payments</h4>
                    <p>If any payment is declined or fails for any reason (including but not limited to insufficient funds, expired cards, or fraud detection), you remain responsible for all charges incurred. We reserve the right to suspend or terminate your account until all outstanding amounts are paid. You may be subject to penalties, citations, or enforcement actions from Parking Operators for unpaid parking sessions, even if the payment failure was due to technical issues with the payment processor.</p>

                    <h3>6. PARKING VIOLATIONS AND ENFORCEMENT</h3>
                    <ul>
                        <li>Cashphalt does not enforce parking regulations, issue citations, or assess parking penalties. All enforcement actions are undertaken by Parking Operators or authorized enforcement entities.</li>
                        <li>You are solely responsible for compliance with all parking rules, regulations, and restrictions posted at parking facilities or communicated through other means.</li>
                        <li>Cashphalt is not liable for any citations, fines, penalties, towing, booting, or other enforcement actions taken against your vehicle, even if you used the Platform for the associated parking session and even if the issue was related to payment processing failures.</li>
                        <li>You acknowledge that use of the Platform does not guarantee parking availability, successful payment transmission to Parking Operators, or exemption from parking regulations.</li>
                        <li>Any disputes regarding parking citations or enforcement actions must be resolved directly with the applicable Parking Operator or enforcement authority. We may assist in providing transaction records upon request, but we do not represent you in disputes with Parking Operators.</li>
                        <li>You are responsible for ensuring that your parking session is properly activated before leaving your vehicle. Technical issues, payment processor delays, or communication failures between the Platform and Parking Operators may result in enforcement actions for which we are not liable.</li>
                    </ul>

                    <h3>7. INTELLECTUAL PROPERTY RIGHTS</h3>
                    <h4>7.1 Ownership</h4>
                    <p>The Platform and all content, features, and functionality, including but not limited to software, text, graphics, logos, images, audio, video, data compilations, and the overall design, are owned by Cashphalt Parking Solutions, LLC, its licensors, or other content providers and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>

                    <h4>7.2 Limited License</h4>
                    <p>Subject to your compliance with these Terms, Cashphalt grants you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access and use the Platform for your personal, non-commercial use. This license does not include any right to: (a) resell or make commercial use of the Platform; (b) modify or make derivative works of the Platform; (c) download or copy content except as expressly permitted; (d) use data mining, robots, or similar data gathering tools; or (e) use the Platform in any manner that could damage or overburden our systems.</p>

                    <h4>7.3 Trademarks</h4>
                    <p>CASHPHALT and all related logos, product and service names, designs, and slogans are trademarks of Cashphalt Parking Solutions, LLC. You may not use such marks without our prior written permission. All other names, logos, and marks are the property of their respective owners.</p>

                    <h3>8. DISCLAIMERS AND WARRANTIES</h3>
                    <p className="uppercase font-bold">THE PLATFORM AND ALL SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.</p>
                    <p>Cashphalt does not warrant that:</p>
                    <ul>
                        <li>The Platform will meet your requirements or expectations;</li>
                        <li>The Platform will be available at all times, uninterrupted, timely, secure, or error-free;</li>
                        <li>Payment transactions will be processed successfully or without delay;</li>
                        <li>Our third-party payment processors will operate without interruption or error;</li>
                        <li>The results obtained from use of the Platform will be accurate or reliable;</li>
                        <li>The quality of any services, information, or other material obtained through the Platform will meet your expectations;</li>
                        <li>Any errors or defects in the Platform will be corrected;</li>
                        <li>The Platform is free of viruses or other harmful components;</li>
                        <li>Parking spaces will be available at any particular location or time;</li>
                        <li>Communication between the Platform and Parking Operators will occur in real-time or without errors.</li>
                    </ul>
                    <p className="uppercase">You acknowledge that Cashphalt has no control over parking facilities, payment processor operations, or third-party services, and you assume all risks associated with parking your vehicle, including but not limited to damage, theft, loss of property, and personal injury. CASHPHALT IS NOT RESPONSIBLE FOR THE SAFETY OR SECURITY OF YOUR VEHICLE OR BELONGINGS AT ANY PARKING LOCATION, NOR FOR ANY FAILURES OR ERRORS BY THIRD-PARTY PAYMENT PROCESSORS.</p>

                    <h3>9. LIMITATION OF LIABILITY</h3>
                    <p className="uppercase font-bold">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL CASHPHALT PARKING SOLUTIONS, LLC, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOST PROFITS, LOST REVENUE, LOST DATA, PARKING CITATIONS, TOWING FEES, VEHICLE DAMAGE, OR BUSINESS INTERRUPTION, ARISING OUT OF OR RELATING TO YOUR USE OF OR INABILITY TO USE THE PLATFORM, PAYMENT PROCESSING FAILURES, OR THE ACTS OR OMISSIONS OF THIRD-PARTY PAYMENT PROCESSORS, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), STATUTE, OR ANY OTHER LEGAL THEORY, EVEN IF CASHPHALT HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
                    <p className="uppercase font-bold">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE TOTAL LIABILITY OF CASHPHALT FOR ANY CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE PLATFORM SHALL NOT EXCEED THE GREATER OF: (A) THE AMOUNT YOU PAID TO CASHPHALT IN SERVICE FEES (NOT INCLUDING PARKING CHARGES PASSED THROUGH TO PARKING OPERATORS) IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY, OR (B) ONE HUNDRED DOLLARS ($100.00).</p>
                    <p>You acknowledge that the parking fees and other charges you pay through the Platform are paid to Parking Operators, not to Cashphalt. Cashphalt's role is limited to facilitating these transactions through our Platform and third-party payment processors. Accordingly, Cashphalt's liability is limited as set forth above and does not extend to amounts paid to Parking Operators or payment processors.</p>
                    <p>Some jurisdictions do not allow the exclusion or limitation of certain warranties or the limitation or exclusion of liability for incidental or consequential damages. Accordingly, some of the above limitations may not apply to you. In such jurisdictions, our liability is limited to the greatest extent permitted by law.</p>

                    <h3>10. INDEMNIFICATION</h3>
                    <p>You agree to indemnify, defend, and hold harmless Cashphalt Parking Solutions, LLC, its affiliates, and their respective officers, directors, employees, agents, licensors, and service providers (including our third-party payment processors) from and against any and all claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to: (a) your use of or inability to use the Platform; (b) your violation of these Terms; (c) your violation of any rights of another party, including any Parking Operator; (d) your violation of any applicable laws, rules, or regulations; (e) any parking citations, fines, or enforcement actions; (f) any damage to or loss of your vehicle or property; (g) any other party's access to or use of the Platform with your account credentials; (h) any payment disputes, chargebacks, or fraud allegations; (i) your provision of inaccurate information; or (j) any claims related to payment processing or transactions facilitated through the Platform.</p>

                    <h3>11. PRIVACY AND DATA COLLECTION</h3>
                    <h4>11.1 Privacy Policy</h4>
                    <p>Your use of the Platform is subject to our Privacy Policy, which is incorporated into these Terms by reference. By using the Platform, you consent to our collection, use, and disclosure of your personal information as described in the Privacy Policy.</p>

                    <h4>11.2 Data We Collect</h4>
                    <p>We collect information you provide directly, including your name, email address, phone number, vehicle information (including license plate numbers), and location data when you use our Services. We also collect usage data, device information, and other information through cookies and similar technologies. Payment card information is collected and processed directly by our third-party payment processor (currently Stripe) and is not stored on our servers.</p>

                    <h4>11.3 Payment Information</h4>
                    <p>Payment card information is transmitted directly to and processed by Stripe in accordance with Stripe's Privacy Policy and PCI-DSS requirements. We do not have access to or store your complete credit card numbers. We may receive and store limited payment information from Stripe, such as the last four digits of your card, card brand, and expiration date, for account management and customer service purposes. For complete information about how Stripe handles your payment data, please review Stripe's Privacy Policy at <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">https://stripe.com/privacy</a>.</p>

                    <h4>11.4 Information Sharing</h4>
                    <p>We may share your information with: (a) Parking Operators to facilitate parking services; (b) Stripe and other payment processors to process transactions; (c) enforcement agencies when legally required or authorized by you; (d) service providers who assist in operating our Platform; and (e) as required by law or to protect our rights and the rights of others. We do not sell your personal information to third parties.</p>

                    <h3>12. TERM AND TERMINATION</h3>
                    <ol>
                        <li>These Terms commence on the date you first access or use the Platform and continue until terminated.</li>
                        <li>You may terminate your account at any time by contacting customer support or through account settings in the Platform. Termination does not relieve you of any payment obligations or other obligations incurred prior to termination.</li>
                        <li>We may suspend or terminate your access to the Platform immediately, without prior notice or liability, for any reason, including but not limited to: (a) breach of these Terms; (b) fraudulent or illegal activity; (c) providing false or misleading information; (d) failure to pay amounts owed; (e) excessive chargebacks or payment disputes; or (f) conduct that we determine, in our sole discretion, is harmful to other users, third parties, or our business interests.</li>
                        <li>Upon termination, your right to use the Platform will immediately cease. You will remain liable for all charges and obligations incurred prior to termination. Sections that by their nature should survive termination shall survive, including but not limited to intellectual property provisions, disclaimers, limitations of liability, indemnification, and dispute resolution provisions.</li>
                        <li>We reserve the right to retain your information as required by law or for legitimate business purposes following termination.</li>
                    </ol>

                    <h3>13. DISPUTE RESOLUTION AND ARBITRATION</h3>
                    <h4>13.1 Binding Arbitration</h4>
                    <p className="font-bold">PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS, INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT.</p>
                    <p>You and Cashphalt agree that any dispute, claim, or controversy arising out of or relating to these Terms, your use of the Platform, or any transactions facilitated through the Platform (including disputes related to payment processing) shall be settled by binding arbitration administered by the American Arbitration Association ("AAA") in accordance with its Commercial Arbitration Rules, except as modified by this Section. The arbitration shall be conducted before a single arbitrator and shall be limited solely to the dispute between you and Cashphalt.</p>

                    <h4>13.2 Class Action Waiver</h4>
                    <p className="uppercase font-bold">YOU AND CASHPHALT AGREE THAT EACH PARTY MAY BRING CLAIMS AGAINST THE OTHER ONLY IN AN INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE ACTION OR PROCEEDING. UNLESS BOTH YOU AND CASHPHALT AGREE OTHERWISE, THE ARBITRATOR MAY NOT CONSOLIDATE OR JOIN MORE THAN ONE PERSON'S OR PARTY'S CLAIMS AND MAY NOT OTHERWISE PRESIDE OVER ANY FORM OF A CONSOLIDATED, REPRESENTATIVE, OR CLASS PROCEEDING.</p>

                    <h4>13.3 Arbitration Procedures</h4>
                    <ul>
                        <li>The arbitration will be conducted in the English language and will take place in the county where you reside or another mutually agreeable location.</li>
                        <li>The arbitrator's award shall be final and binding and may be entered as a judgment in any court of competent jurisdiction.</li>
                        <li>Each party shall bear its own costs and attorneys' fees, unless the arbitrator determines otherwise in accordance with applicable law.</li>
                        <li>For claims under $10,000, you may choose whether the arbitration will be conducted through telephonic or video conference hearings, based solely on written submissions, or through an in-person hearing.</li>
                    </ul>

                    <h4>13.4 Exceptions to Arbitration</h4>
                    <p>Notwithstanding the above, either party may seek injunctive or other equitable relief in any court of competent jurisdiction to prevent actual or threatened infringement, misappropriation, or violation of a party's intellectual property rights or to enforce these arbitration provisions.</p>

                    <h4>13.5 Opt-Out Right</h4>
                    <p>You may opt out of this arbitration agreement by sending written notice to Cashphalt within thirty (30) days of first accepting these Terms. The notice must include your name, address, email address associated with your account, and a clear statement that you wish to opt out of this arbitration agreement. Send the opt-out notice to: [Your Physical Address] or [legal@cashphalt.com]. If you opt out, all other provisions of these Terms will continue to apply, but disputes will be resolved in court as set forth in Section 14 below.</p>

                    <h3>14. GOVERNING LAW AND JURISDICTION</h3>
                    <ol>
                        <li>These Terms and any dispute or claim arising out of or in connection with them or their subject matter shall be governed by and construed in accordance with the laws of the State of [YOUR STATE], without regard to its conflict of law provisions.</li>
                        <li>To the extent that the arbitration provisions do not apply or you have opted out of arbitration, you agree that any legal action or proceeding arising out of or relating to these Terms or the Platform shall be brought exclusively in the state or federal courts located in [YOUR COUNTY], [YOUR STATE], and you hereby consent to the personal jurisdiction and venue of such courts.</li>
                        <li>You waive any objection to the exercise of jurisdiction by such courts and to venue in such courts.</li>
                    </ol>

                    <h3>15. MODIFICATIONS TO TERMS</h3>
                    <p>We reserve the right to modify these Terms at any time in our sole discretion. We will provide notice of material changes by posting the updated Terms on the Platform with a revised "Effective Date" and may also notify you via email or through the Platform. Your continued use of the Platform after the effective date of any modifications constitutes your acceptance of the modified Terms. If you do not agree to the modified Terms, you must stop using the Platform and terminate your account. We encourage you to review the Terms periodically to stay informed of updates.</p>

                    <h3>16. THIRD-PARTY SERVICES AND LINKS</h3>
                    <ol>
                        <li>The Platform may integrate with or contain links to third-party services, including payment processors (such as Stripe), mapping services, parking operator systems, and other third-party websites or applications.</li>
                        <li>Your use of third-party services is subject to those third parties' terms of service and privacy policies. We are not responsible for the content, accuracy, or functionality of third-party services.</li>
                        <li>We do not endorse or make any representations about third-party services. Any interactions you have with third-party service providers are solely between you and those providers.</li>
                        <li>We are not liable for any damages or losses arising from your use of third-party services or your reliance on any information provided by third parties.</li>
                    </ol>

                    <h3>17. GENERAL PROVISIONS</h3>
                    <h4>17.1 Entire Agreement</h4>
                    <p>These Terms, together with our Privacy Policy and any other legal notices or agreements published on the Platform, constitute the entire agreement between you and Cashphalt regarding your use of the Platform and supersede all prior agreements and understandings, whether written or oral.</p>

                    <h4>17.2 Severability</h4>
                    <p>If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be deemed severable and shall not affect the validity and enforceability of the remaining provisions, which shall remain in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable.</p>

                    <h4>17.3 Waiver</h4>
                    <p>No waiver of any term or condition of these Terms shall be deemed a further or continuing waiver of such term or condition or any other term or condition. Our failure to assert any right or provision under these Terms shall not constitute a waiver of such right or provision.</p>

                    <h4>17.4 Assignment</h4>
                    <p>You may not assign or transfer these Terms or your rights and obligations hereunder, in whole or in part, without our prior written consent. We may assign these Terms or any rights hereunder without your consent or prior notice, including in connection with a merger, acquisition, or sale of assets. Any attempted assignment in violation of this provision shall be null and void.</p>

                    <h4>17.5 No Third-Party Beneficiaries</h4>
                    <p>These Terms are for the benefit of, and shall be enforceable by, only you and Cashphalt. These Terms shall not be construed to create or imply any third-party beneficiary rights in any other person or entity, except that our payment processors and service providers are intended third-party beneficiaries of the limitation of liability and indemnification provisions.</p>

                    <h4>17.6 Force Majeure</h4>
                    <p>Cashphalt shall not be liable for any failure or delay in performance due to causes beyond its reasonable control, including but not limited to acts of God, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, pandemics, strikes, shortages of transportation facilities, fuel, energy, labor, or materials, or failures of third-party service providers (including payment processors and hosting providers).</p>

                    <h4>17.7 Statute of Limitations</h4>
                    <p>You agree that regardless of any statute or law to the contrary, any claim or cause of action arising out of or related to your use of the Platform or these Terms must be filed within one (1) year after such claim or cause of action arose or be forever barred.</p>

                    <h4>17.8 Headings</h4>
                    <p>The headings and captions used in these Terms are for convenience only and shall not affect the interpretation of these Terms.</p>

                    <h4>17.9 Electronic Communications</h4>
                    <p>You consent to receive communications from us electronically, including via email, SMS text messages, push notifications, and in-app messages. You agree that all agreements, notices, disclosures, and other communications that we provide to you electronically satisfy any legal requirement that such communications be in writing. Standard messaging and data rates may apply to SMS communications.</p>

                    <h4>17.10 Language</h4>
                    <p>These Terms are drafted in the English language. If these Terms are translated into any other language, the English language version shall prevail to the extent of any conflict or inconsistency.</p>

                    <h3>18. CONTACT INFORMATION</h3>
                    <p>If you have any questions, concerns, or complaints about these Terms or the Platform, please contact us at:</p>
                    <address className="not-italic">
                        Cashphalt Parking Solutions, LLC<br />
                        [Your Physical Address]<br />
                        [City, State ZIP Code]<br />
                        Email: <a href="mailto:support@cashphalt.com">support@cashphalt.com</a><br />
                        Legal/Opt-Out Notices: <a href="mailto:legal@cashphalt.com">legal@cashphalt.com</a><br />
                        Phone: [Your Phone Number]
                    </address>

                    <h3>19. ACKNOWLEDGMENT</h3>
                    <p className="uppercase font-bold">BY USING THE PLATFORM, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS AND CONDITIONS, UNDERSTAND THEM, AND AGREE TO BE BOUND BY THEIR TERMS AND CONDITIONS. YOU SPECIFICALLY ACKNOWLEDGE AND AGREE THAT: (A) CASHPHALT USES THIRD-PARTY PAYMENT PROCESSORS AND IS NOT DIRECTLY RESPONSIBLE FOR PAYMENT PROCESSING FAILURES; (B) ALL SALES ARE FINAL WITH NO REFUNDS; (C) YOU ARE SOLELY RESPONSIBLE FOR PARKING VIOLATIONS AND ENFORCEMENT ACTIONS; (D) CASHPHALT'S LIABILITY IS LIMITED AS SET FORTH IN THESE TERMS; AND (E) DISPUTES WILL BE RESOLVED THROUGH BINDING ARBITRATION UNLESS YOU OPT OUT. IF YOU DO NOT AGREE TO THESE TERMS, YOU ARE NOT AUTHORIZED TO USE THE PLATFORM AND MUST DISCONTINUE USE IMMEDIATELY.</p>
                    <p className="text-center mt-8 font-bold">* * * END OF TERMS AND CONDITIONS * * *</p>
                </Card>
            </div>
        </div>
    )
}
