<?php
/**
 * Created by JetBrains PhpStorm.
 * User: Ernesto J. Rodriguez (Certun)
 * File: patient.class.php
 * Date: 1/13/12
 * Time: 7:10 AM
 */
if(!isset($_SESSION)){
    session_name ("MitosEHR" );
    session_start();
    session_cache_limiter('private');
}

include_once($_SESSION['site']['root'].'/dataProvider/Person.php');
include_once($_SESSION['site']['root'].'/classes/dbHelper.php');

class Patient extends Person {
    /**
     * @var dbHelper
     */
    private $db;

    function __construct(){
        $this->db = new dbHelper();
        return;
    }

    /**
     * @return mixed
     */
    protected function getCurrPid(){
        return $_SESSION['patient']['pid'];
    }

    /**
     * @param \stdClass $params
     * @internal param $pid
     * @return mixed
     */
    public function currPatientSet(stdClass $params){
        $_SESSION['patient']['pid']  = $params->pid;
        $_SESSION['patient']['name'] = $this->getPatientFullNameByPid($params->pid);
        return;
    }

    /**
     * @return mixed
     */
    public function currPatientUnset(){
        $_SESSION['patient']['pid']  = null;
        $_SESSION['patient']['name'] = null;
        return;
    }

    public function createNewPatient(stdClass $params){
        $data = get_object_vars($params);

        foreach ($data as $key => $val) {
            if ($val == null) unset($data[$key]);
            if ($val === false) $data[$key] = 0;
            if ($val === true) $data[$key] = 1;
        }

        $this->db->setSQL($this->db->sqlBind($data, "form_data_demographics", "I"));
        $this->db->execLog();
        $pid = $this->db->lastInsertId;

        $this->db->setSQL("SELECT pid, fname, mname, lname
                     FROM form_data_demographics
                    WHERE pid = '$pid'");

        $patient = $this->db->fetchRecord(PDO::FETCH_ASSOC);
        $patient['fullname'] = $this->fullname($patient['fname'], $patient['mname'], $patient['lname']);

        if(!$this->createPatientDir($pid)){
            return array("success" =>false, "error"=> 'Patient directory failed');
        };

        $this->createPatientQrCode($pid,$patient['fullname']);

        return array("success" =>true, "patient"=> array( "pid"=> $pid , "fullname" => $patient['fullname']));
    }

    /**
     * @param $pid
     * @return string
     */
    public function getPatientFullNameByPid($pid){
        $this->db->setSQL("SELECT fname,mname,lname FROM form_data_demographics WHERE pid = '$pid'");
        $p = $this->db->fetchRecord();
        return $this->fullname($p['fname'],$p['mname'],$p['lname']);
    }
    /**
     * @param \stdClass $params
     * @internal param $search
     * @internal param $start
     * @internal param $limit
     * @return array
     */
    public function patientLiveSearch(stdClass $params){
        $this->db->setSQL("SELECT pid,pubpid,fname,lname,mname,DOB,SS
                             FROM form_data_demographics
                            WHERE fname LIKE '$params->query%'
                               OR lname LIKE '$params->query%'
                               OR mname LIKE '$params->query%'
                               OR pid 	LIKE '$params->query%'
                               OR SS 	LIKE '%$params->query'");
        $rows = array();
        foreach($this->db->fetchRecords(PDO::FETCH_CLASS) as $row){
            $row->fullname = $this->fullname($row->fname,$row->mname,$row->lname);
            unset($row->fname,$row->mname,$row->lname);
            array_push($rows, $row);
        }
        $total  = count($rows);
        $rows = $this->db->filterByStartLimit($rows,$params);
        return array('totals'=>$total ,'rows'=>$rows);
    }

    /**
     * @param stdClass $params
     * @return array
     */
    public function getPatientDemographicData(stdClass $params){
        $pid = $_SESSION['patient']['pid'];
        $this->db->setSQL("SELECT * FROM form_data_demographics WHERE pid = '$pid'");

        $rows = array();
        foreach($this->db->fetchRecords(PDO::FETCH_ASSOC) as $row){
            array_push($rows, $row);
        }
        return $rows;

    }


    /**
     * Form now this is just getting the latest open encounter for all the patients.
     * TODO: create the table to handle tha pool area and fix this function
     * @return array
     */
    public function getPatientsByPoolArea(){
    //public function getPatientsByPoolArea(stdClass $params){
        $rows = array();
        $this->db->setSQL("SELECT DISTINCT p.pid, p.title, p.fname, p.mname, p.lname, MAX(e.eid)
                         FROM form_data_demographics AS p
                   RIGHT JOIN form_data_encounter AS e
                           ON p.pid = e.pid
                        WHERE e.close_date IS NULL
                     GROUP BY p.pid LIMIT 6");
        foreach($this->db->fetchRecords(PDO::FETCH_ASSOC) as $row){
            $foo['name'] = Person::fullname($row['fname'],$row['mname'],$row['lname']);
            $foo['shortName'] = Person::ellipsis($foo['name'],20);
            $foo['pid'] = $row['pid'];
            $foo['eid'] = $row['MAX(e.eid)'];
            $foo['img'] = 'ui_icons/user_32.png';
            array_push($rows, $foo);
        }
        return $rows;
    }

    private function createPatientDir($pid){
        $root =  $_SESSION['site']['root'];
        $site = $_SESSION['site']['site'];
        $path = $root.'/sites/'.$site.'/patients/'.$pid;
        if(mkdir($path, 0777,true )){
            chmod($path,0777);
            return true;
        }else{
            return false;
        }
    }

    public function createPatientQrCode($pid, $fullname){
        //set it to writable location, a place for temp generated PNG files
        $root =  $_SESSION['site']['root'];
        $site = $_SESSION['site']['site'];
        $path = $root.'/sites/'.$site.'/patients/'.$pid;
        $data = '{"name":"'.$fullname.'","pid":'.$pid.',"ehr": "MitosEHR"}';
        $PNG_TEMP_DIR = $path;
        include($root."/lib/phpqrcode/qrlib.php");
        $filename = $PNG_TEMP_DIR. '/patientDataQrCode.png';
        QRcode::png($data, $filename, 'Q', 2, 2);
    }

	public function getPatientAddressById($pid){

		$this->db->setSQL("SELECT * FROM form_data_demographics WHERE pid = '$pid'");
		$p = $this->db->fetchRecord();

		$address = $p['address'] . ' <br>' .  $p['city'] . ',  ' . $p['state'] . ' ' . $p['country'];

		return $address;
	}
}
//$p = new Patient();
//echo '<pre>';
//print_r($p->createPatientDir(2));